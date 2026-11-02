import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_invoice_pdf_bytes(invoice):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    styles = getSampleStyleSheet()

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
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#1E293B"),
    )

    elements = []

    # Company Header
    elements.append(Paragraph("<b>TAX INVOICE / RECEIPT</b>", title_style))
    elements.append(Paragraph("<b>BIZ499 DIGITAL SERVICES PRIVATE LIMITED</b><br/>Tech Park, High Street, Mumbai 400001<br/>GSTIN: 27ABCDE1234F1Z5 | Support: support@biz499.com", subtitle_style))
    elements.append(Spacer(1, 14))

    # Invoice and Billing Details Table
    meta_data = [
        [
            Paragraph(f"<b>INVOICE DETAILS</b><br/>Invoice No: <b>{invoice.invoice_number}</b><br/>Order Ref: {invoice.order.order_number}<br/>Date of Issue: {invoice.issue_date.strftime('%d %b %Y')}<br/>Status: <b>{invoice.status}</b>", subtitle_style),
            Paragraph(f"<b>BILLED TO:</b><br/><b>{invoice.business_name or invoice.recipient_name}</b><br/>Contact: {invoice.recipient_name}<br/>{invoice.recipient_email} | {invoice.recipient_phone}<br/>GSTIN: {invoice.gstin or 'Unregistered Consumer'}", subtitle_style),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('PADDING', (0,0), (-1,-1), 0),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 10))

    # Line Items Table
    table_data = [
        [
            Paragraph("<b>Item Description</b>", header_style),
            Paragraph("<b>Qty</b>", header_style),
            Paragraph("<b>Rate (₹)</b>", header_style),
            Paragraph("<b>Amount (₹)</b>", header_style),
        ]
    ]

    for item in invoice.items.all():
        table_data.append([
            Paragraph(item.description, subtitle_style),
            Paragraph(str(item.quantity), subtitle_style),
            Paragraph(f"{item.unit_price:,.2f}", subtitle_style),
            Paragraph(f"{item.total_price:,.2f}", subtitle_style),
        ])

    table_data.append(["", "", Paragraph("<b>Taxable Subtotal:</b>", subtitle_style), Paragraph(f"₹{invoice.subtotal:,.2f}", subtitle_style)])
    table_data.append(["", "", Paragraph(f"<b>GST ({invoice.tax_percentage}%):</b>", subtitle_style), Paragraph(f"₹{invoice.tax_amount:,.2f}", subtitle_style)])
    table_data.append(["", "", Paragraph("<b>Total Value:</b>", header_style), Paragraph(f"<b>₹{invoice.total_amount:,.2f}</b>", header_style)])
    table_data.append(["", "", Paragraph("<b>Amount Received:</b>", subtitle_style), Paragraph(f"₹{invoice.amount_paid:,.2f}", subtitle_style)])
    table_data.append(["", "", Paragraph("<b>Balance Remaining:</b>", header_style), Paragraph(f"<b>₹{invoice.balance_due:,.2f}</b>", header_style)])

    items_table = Table(table_data, colWidths=[290, 40, 100, 110])
    items_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F8FAFC")),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, len(table_data) - 6), 0.5, colors.HexColor("#E2E8F0")),
        ('LINEBELOW', (0, -1), (-1, -1), 1, colors.HexColor("#0F172A")),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 20))

    elements.append(Paragraph(f"<b>Terms:</b> {invoice.terms}", subtitle_style))
    elements.append(Paragraph("<i>This is a computer-generated invoice and requires no physical signature.</i>", subtitle_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

