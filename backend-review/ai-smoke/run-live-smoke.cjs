const { readFileSync, writeFileSync } = require('node:fs');
const { resolve } = require('node:path');
const assert = require('node:assert/strict');
const { freeModelCandidates, validateInput } = require('../sps-property-project/functions/ai-property-core.cjs');
const { _test } = require('../sps-property-project/functions/ai-property.js');

const here = __dirname;
const dataUrl = (name, type) => `data:${type};base64,${readFileSync(resolve(here, name)).toString('base64')}`;
const key = process.env.OPENROUTER_API_KEY;

async function main() {
  if (!key) throw new Error('ไม่มีคีย์ OpenRouter สำหรับการทดสอบในเครื่อง');
  const files = [
    { id: 'pdf-sample', name: 'sample-property.pdf', type: 'application/pdf', dataUrl: dataUrl('sample-property.pdf', 'application/pdf') },
    { id: 'image-a', name: 'type-a.png', type: 'image/png', dataUrl: dataUrl('type-a.png', 'image/png') },
    { id: 'image-b', name: 'type-b.png', type: 'image/png', dataUrl: dataUrl('type-b.png', 'image/png') },
  ];
  const message = 'นี่เป็นข้อมูลสมมุติสำหรับทดสอบเท่านั้น ห้ามสร้างหรือเผยแพร่ประกาศจริง โปรดอ่าน PDF และรูปแนบ แยก TYPE A และ TYPE B เป็นทรัพย์ 2 รายการ จับคู่ image-a กับ TYPE A และ image-b กับ TYPE B เลือกรูปหน้าปกของแต่ละแบบ กรอกราคา ส่วนลด พื้นที่ ห้อง ของแถม ทำเล และ evidence ให้ครบ โดยห้ามเดาข้อมูลที่ไม่มี';
  const input = validateInput({ message, files, history: [], properties: [] });
  const response = await fetch('https://openrouter.ai/api/v1/models', { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`ตรวจสอบรุ่นฟรีไม่สำเร็จ (${response.status})`);
  const catalog = await response.json();
  const candidates = freeModelCandidates(catalog.data).map(model => model.id);
  if (!candidates.length) throw new Error('ไม่พบโมเดลฟรีที่รองรับข้อความ รูปภาพ และ JSON');
  console.log(JSON.stringify({ stage: 'requesting', freeCandidates: candidates.slice(0, 3), inputFiles: files.map(({ id, name, type }) => ({ id, name, type })) }));
  const result = await _test.runFreeCompletion(input, candidates, key);
  writeFileSync(resolve(here, 'result.json'), JSON.stringify(result, null, 2));
  const summary = {
    model: result.model,
    reply: result.reply,
    questions: result.questions,
    properties: result.properties.map(p => ({
      title: p.title, type: p.type, project: p.project,
      price: p.price, bankPrice: p.bankPrice, discountAmount: p.discountAmount,
      bedrooms: p.bedrooms, bathrooms: p.bathrooms,
      landAreaSqw: p.landAreaSqw, usableAreaSqm: p.usableAreaSqm,
      location: p.location, listingType: p.listingType, propertyCondition: p.propertyCondition,
      imageIds: p.imageIds, coverImageId: p.coverImageId,
      gifts: p.gifts, questions: p.questions,
    })),
  };
  console.log(JSON.stringify({ stage: 'completed', ...summary }, null, 2));
  assert.equal(result.properties.length, 2, 'AI ต้องแยกทรัพย์ 2 รายการ');
  const a = result.properties.find(p => p.imageIds.includes('image-a'));
  const b = result.properties.find(p => p.imageIds.includes('image-b'));
  assert.ok(a && b, 'AI ต้องจับคู่รูปกับทรัพย์ทั้งสองแบบ');
  assert.equal(a.type, 'SPS-TH-2CLASS-ID');
  assert.equal(a.price, 1690000);
  assert.equal(a.bankPrice, 1890000);
  assert.equal(a.discountAmount, 200000);
  assert.equal(a.landAreaSqw, 18);
  assert.equal(a.usableAreaSqm, 110);
  assert.equal(b.type, 'SPS-S-1CLASS-ID');
  assert.equal(b.price, 2590000);
  assert.equal(b.landAreaSqw, 40);
  assert.equal(b.usableAreaSqm, 120);
  for (const p of [a, b]) {
    assert.equal(p.bedrooms, 3);
    assert.equal(p.bathrooms, 2);
    assert.equal(p.location.province, 'ชลบุรี');
    assert.equal(p.location.district, 'พานทอง');
    assert.equal(p.listingType, 'sale');
    assert.equal(p.propertyCondition, 'มือ 1');
    assert.equal(p.coverImageId, p.imageIds[0]);
  }
  console.log(JSON.stringify({ stage: 'verified', passed: true, firestoreWrites: 0, storageWrites: 0 }));
}

main().catch(error => {
  console.error(JSON.stringify({ stage: 'failed', code: error.code || 'unknown', message: error.message }));
  process.exitCode = 1;
});
