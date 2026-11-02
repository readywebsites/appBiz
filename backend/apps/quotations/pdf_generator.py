import io
from decimal import Decimal
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_quote_pdf_bytes(quote):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        "TitleStyle",
        parent=styles["Heading1"],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor("#0F172A"),
    )
    subtitle_style = ParagraphStyle(
        "SubStyle",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#475569"),
    )
    header_style = ParagraphStyle(
        "HeaderStyle",
        parent=styles["Heading3"],
        fontSize=12,
        leading=16,
        textColor=colors.HexColor("#1E293B"),
    )

    elements = []

    # Header
    elements.append(Paragraph("<b>BIZ499 DIGITAL SERVICES</b>", title_style))
    elements.append(Paragraph("Website Development, E-Commerce & Growth Solutions<br/>Email: support@biz499.com | Web: www.biz499.com", subtitle_style))
    elements.append(Spacer(1, 16))

    # Quotation info table
    quote_info = [
        [
            Paragraph(f"<b>QUOTATION</b><br/>Ref: <b>{quote.quote_number}</b><br/>Date: {quote.created_at.strftime('%d %b %Y')}<br/>Valid Until: {quote.valid_until or '15 Days from issue'}", subtitle_style),
            Paragraph(f"<b>PREPARED FOR:</b><br/>{quote.recipient_name}<br/>{quote.company_name or 'Independent Business'}<br/>{quote.recipient_email} | {quote.recipient_phone}", subtitle_style),
        ]
    ]
    info_table = Table(quote_info, colWidths=[270, 270])
    info_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 12),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 12))

    # Items Table
    table_data = [
        [
            Paragraph("<b>Description / Scope</b>", header_style),
            Paragraph("<b>Qty</b>", header_style),
            Paragraph("<b>Unit Price (₹)</b>", header_style),
            Paragraph("<b>Total (₹)</b>", header_style),
        ]
    ]

    for item in quote.items.all():
        table_data.append([
            Paragraph(item.description, subtitle_style),
            Paragraph(str(item.quantity), subtitle_style),
            Paragraph(f"{item.unit_price:,.2f}", subtitle_style),
            Paragraph(f"{item.total_price:,.2f}", subtitle_style),
        ])

    # Totals
    table_data.append(["", "", Paragraph("<b>Subtotal:</b>", subtitle_style), Paragraph(f"₹{quote.subtotal:,.2f}", subtitle_style)])
    if quote.discount_amount > 0:
        table_data.append(["", "", Paragraph("<b>Discount:</b>", subtitle_style), Paragraph(f"-₹{quote.discount_amount:,.2f}", subtitle_style)])
    table_data.append(["", "", Paragraph(f"<b>Tax (GST {quote.tax_percentage}%):</b>", subtitle_style), Paragraph(f"₹{quote.tax_amount:,.2f}", subtitle_style)])
    table_data.append(["", "", Paragraph("<b>Grand Total:</b>", header_style), Paragraph(f"<b>₹{quote.total_amount:,.2f}</b>", header_style)])

    items_table = Table(table_data, colWidths=[290, 40, 100, 110])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor("#0F172A")),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, len(table_data) - 5), 0.5, colors.HexColor("#CBD5E1")),
        ('LINEBELOW', (0, -1), (-1, -1), 1.5, colors.HexColor("#0F172A")),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 20))

    # Terms & Conditions
    elements.append(Paragraph("<b>Terms & Conditions:</b>", header_style))
    terms_text = quote.terms.replace("\n", "<br/>") if quote.terms else "Standard Biz499 development terms apply."
    elements.append(Paragraph(terms_text, subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

