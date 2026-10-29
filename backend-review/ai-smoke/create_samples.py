from pathlib import Path
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image, ImageDraw, ImageFont

OUT = Path(__file__).resolve().parent
regular = '/Library/Fonts/Arial Unicode.ttf'
bold = regular
pdfmetrics.registerFont(TTFont('DaimonCJK', regular))
pdfmetrics.registerFont(TTFont('DaimonCJK-Bold', bold))
pdfmetrics.registerFontFamily('DaimonCJK', normal='DaimonCJK', bold='DaimonCJK-Bold')

styles = getSampleStyleSheet()
title = ParagraphStyle('ThaiTitle', parent=styles['Title'], fontName='DaimonCJK-Bold', fontSize=19, leading=26, textColor=HexColor('#17365d'))
body = ParagraphStyle('ThaiBody', parent=styles['BodyText'], fontName='DaimonCJK', fontSize=11, leading=18, textColor=HexColor('#333333'))
small = ParagraphStyle('ThaiSmall', parent=body, fontSize=9, leading=14, textColor=HexColor('#666666'))

doc = SimpleDocTemplate(str(OUT / 'sample-property.pdf'), pagesize=A4, topMargin=2*cm, bottomMargin=2*cm, leftMargin=2*cm, rightMargin=2*cm, title='ข้อมูลบ้านทดสอบสำหรับ AI', author='SPS test fixture')
story = [
    Paragraph('ข้อมูลทดสอบโครงการบ้านอยู่ดี', title),
    Paragraph('เอกสารสมมุติสำหรับทดสอบระบบเท่านั้น ไม่ใช่ประกาศขายจริง', small),
    Spacer(1, 0.5*cm),
]
rows = [
    ['รายการ', 'TYPE A', 'TYPE B'],
    ['ประเภท', 'ทาวน์โฮม 2 ชั้น', 'บ้านเดี่ยว 1 ชั้น'],
    ['ห้องนอน / ห้องน้ำ', '3 / 2', '3 / 2'],
    ['พื้นที่ดิน', '18 ตารางวา', '40 ตารางวา'],
    ['พื้นที่ใช้สอย', '110 ตารางเมตร', '120 ตารางเมตร'],
    ['ราคาก่อนส่วนลด', '1,890,000 บาท', '2,590,000 บาท'],
    ['ส่วนลด', '200,000 บาท', 'ไม่มี'],
    ['ราคาหลังส่วนลด', '1,690,000 บาท', '2,590,000 บาท'],
    ['ของแถม', 'เครื่องปรับอากาศ 2 เครื่อง ถังเก็บน้ำ 1 ใบ', 'เคาน์เตอร์ครัว ชุดโต๊ะอาหาร'],
]
table = Table([[Paragraph(str(cell), body) for cell in row] for row in rows], colWidths=[3.5*cm, 6.3*cm, 6.3*cm])
table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (-1, 0), 'DaimonCJK-Bold'),
    ('LINEABOVE', (0, 0), (-1, 0), 1.5, HexColor('#17365d')),
    ('LINEBELOW', (0, 0), (-1, 0), 0.75, HexColor('#17365d')),
    ('LINEBELOW', (0, -1), (-1, -1), 1.5, HexColor('#17365d')),
    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ('TOPPADDING', (0, 0), (-1, -1), 6),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story += [table, Spacer(1, 0.5*cm), Paragraph('ทำเล: หนองกะขะ อำเภอพานทอง จังหวัดชลบุรี ประเภทการขาย: ขาย สภาพ: บ้านมือ 1', body), Paragraph('รูป TYPE A และ TYPE B เป็นภาพหน้าบ้านตามแบบที่ระบบแนบมาพร้อมเอกสารนี้', body)]
doc.build(story)

for label, color, floors in [('TYPE A', '#dbeafe', 2), ('TYPE B', '#dcfce7', 1)]:
    image = Image.new('RGB', (1280, 960), '#f8fafc')
    draw = ImageDraw.Draw(image)
    font = ImageFont.truetype(bold, 68)
    small_font = ImageFont.truetype(regular, 34)
    draw.text((70, 60), label, font=font, fill='#0f172a')
    draw.text((70, 155), 'SAMPLE EXTERIOR / NOT A REAL LISTING', font=small_font, fill='#475569')
    base_y = 790 if floors == 2 else 650
    draw.rectangle((230, 330 if floors == 2 else 480, 1040, base_y), fill=color, outline='#334155', width=8)
    draw.polygon([(180, 340 if floors == 2 else 490), (635, 220 if floors == 2 else 330), (1090, 340 if floors == 2 else 490)], fill='#64748b', outline='#334155')
    draw.rectangle((570, base_y-240, 730, base_y), fill='#ffffff', outline='#334155', width=6)
    draw.rectangle((300, base_y-230, 490, base_y-70), fill='#bfdbfe', outline='#334155', width=6)
    draw.rectangle((790, base_y-230, 980, base_y-70), fill='#bfdbfe', outline='#334155', width=6)
    draw.line((70, base_y, 1210, base_y), fill='#16a34a', width=12)
    image.save(OUT / f'{label.lower().replace(" ", "-")}.png', optimize=True)

print('Created sample PDF and two exterior images')
