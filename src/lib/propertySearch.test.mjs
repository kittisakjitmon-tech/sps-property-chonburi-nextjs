import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

// Load the TypeScript helpers without changing the app's bundler resolution.
const asModuleUrl = (source) => `data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText).toString('base64')}`;
const typesUrl = asModuleUrl(readFileSync(new URL('../constants/propertyTypes.ts', import.meta.url), 'utf8'));
const helperUrl = asModuleUrl(readFileSync(new URL('./propertySearch.ts', import.meta.url), 'utf8')
  .replace('../constants/propertyTypes', typesUrl));
const { readPropertyPriceRange, propertyPriceOptions, mergePropertySearchParams, matchesPropertyText,
  matchesPropertyLocation, propertyListingType, propertySubListingType, propertyCreatedTime } = await import(helperUrl);
const { filterPropertiesForSeo, getPropertySearchIntent } = await import(asModuleUrl(
  readFileSync(new URL('./searchIntent.ts', import.meta.url), 'utf8')
    .replace('@/constants/propertyTypes', typesUrl).replace('./propertySearch', helperUrl)
));

const property = {
  id: 'document-1', title: 'บ้านพร้อมอยู่', project: 'อมตะการ์เด้น', displayId: 'SPS-123',
  type: 'SPS-S-1CLASS-ID', price: 1800000, bedrooms: 2, propertySubStatus: 'มือ 2',
  location: { province: 'ชลบุรี', district: 'พานทอง', subDistrict: 'หนองตำลึง' },
  tags: ['ใกล้นิคม'], directInstallment: true, isRental: true,
};

test('home price choices and old links have visible matching options', () => {
  for (const range of ['-1000000', '1000000-2000000', '2000000-3000000', '3000000-5000000', '5000000-10000000', '10000000-', '0-2000000']) {
    const value = readPropertyPriceRange(new URLSearchParams({ priceRange: range }));
    assert.ok(propertyPriceOptions(value).some((option) => option.value === value));
  }
  const custom = readPropertyPriceRange(new URLSearchParams('priceMin=5000&priceMax=15000'));
  assert.equal(custom, '5000-15000');
  assert.equal(propertyPriceOptions(custom).at(-1).label, '5,000 - 15,000 บาท');
});

test('changing unrelated filters migrates and preserves legacy budget links', () => {
  const params = mergePropertySearchParams('priceMin=1000000&priceMax=2000000&location=ชลบุรี', { q: 'บ้าน' });
  assert.equal(params.get('priceRange'), '1000000-2000000');
  assert.equal(params.get('location'), 'ชลบุรี');
  assert.equal(params.has('priceMin'), false);
  assert.equal(mergePropertySearchParams(params.toString(), { priceRange: '' }).has('priceRange'), false);
});

test('text search matches project, ID, Thai type labels, tags and separated terms', () => {
  for (const query of ['อมตะการ์เด้น', 'sps-123', 'บ้านเดี่ยว', 'ใกล้นิคม', '  บ้านเดี่ยว   พานทอง  ', '']) {
    assert.equal(matchesPropertyText(property, query), true, query);
  }
  assert.equal(matchesPropertyText(property, 'คอนโด พัทยา'), false);
  assert.equal(matchesPropertyText({ ...property, tags: null, location: null }, 'อมตะ'), true);
});

test('quick locations include named projects and legacy location fields', () => {
  assert.equal(matchesPropertyLocation(property, 'อมตะ'), true);
  assert.equal(matchesPropertyLocation({ ...property, location: null, province: '', locationDisplay: 'ระยอง' }, 'ระยอง'), true);
  assert.equal(matchesPropertyLocation(property, 'ฉะเชิงเทรา'), false);
});

test('legacy listing fields agree with search intent and SEO results', () => {
  assert.equal(propertyListingType(property), 'rent');
  assert.equal(propertyListingType({ ...property, listingType: 'sale' }), 'sale');
  assert.equal(propertySubListingType(property), 'installment_only');
  assert.equal(propertySubListingType({ ...property, subListingType: 'rent_only' }), 'rent_only');
  const intent = getPropertySearchIntent(new URLSearchParams('listingType=rent&subListingType=installment_only&location=อมตะ'));
  assert.deepEqual(filterPropertiesForSeo([property], intent.filters), [property]);
});

test('latest sort understands serialized and Firestore timestamps', () => {
  assert.equal(propertyCreatedTime({ createdAt: '2026-11-05T00:00:00.000Z' }), Date.parse('2026-11-05T00:00:00Z'));
  assert.equal(propertyCreatedTime({ createdAt: { seconds: 100 } }), 100000);
  assert.equal(propertyCreatedTime({ createdAt: { toMillis: () => 200000 } }), 200000);
  assert.equal(propertyCreatedTime({ createdAt: 300000 }), 300000);
  assert.equal(propertyCreatedTime({}), 0);
});
