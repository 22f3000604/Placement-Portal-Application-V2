"""
PDF Report Generation Utility
Generates well-designed PDF reports using ReportLab
"""
import io
from datetime import datetime, timedelta
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT


def _get_styles():
    """Create custom styles for reports."""
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(
        'ReportTitle', parent=styles['Title'],
        fontSize=22, spaceAfter=6, textColor=colors.HexColor('#4f46e5')
    ))
    styles.add(ParagraphStyle(
        'ReportSubtitle', parent=styles['Normal'],
        fontSize=12, spaceAfter=20, textColor=colors.HexColor('#64748b'), alignment=TA_CENTER
    ))
    styles.add(ParagraphStyle(
        'SectionHeader', parent=styles['Heading2'],
        fontSize=14, spaceBefore=20, spaceAfter=10, textColor=colors.HexColor('#1e293b')
    ))
    styles.add(ParagraphStyle(
        'StatValue', parent=styles['Normal'],
        fontSize=28, alignment=TA_CENTER, textColor=colors.HexColor('#4f46e5'),
        spaceAfter=2
    ))
    styles.add(ParagraphStyle(
        'StatLabel', parent=styles['Normal'],
        fontSize=10, alignment=TA_CENTER, textColor=colors.HexColor('#64748b'),
        spaceAfter=10
    ))
    return styles


def generate_monthly_report_pdf(stats):
    """
    Generate a monthly placement activity report as a PDF.

    Args:
        stats: dict with keys: month_name, drives_conducted, total_applied,
               total_selected, total_rejected, total_shortlisted,
               total_students, total_companies, generated_at

    Returns:
        bytes: PDF file content
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            topMargin=30*mm, bottomMargin=20*mm,
                            leftMargin=25*mm, rightMargin=25*mm)
    styles = _get_styles()
    elements = []

    # Title
    elements.append(Paragraph('Placement Portal', styles['ReportTitle']))
    elements.append(Paragraph(f'Monthly Activity Report — {stats["month_name"]}', styles['ReportSubtitle']))
    elements.append(HRFlowable(width='100%', thickness=2, color=colors.HexColor('#4f46e5'), spaceAfter=20))

    # Summary statistics table
    stat_data = [
        [Paragraph('<b>Drives Conducted</b>', styles['Normal']),
         Paragraph('<b>Applications</b>', styles['Normal']),
         Paragraph('<b>Selected</b>', styles['Normal']),
         Paragraph('<b>Shortlisted</b>', styles['Normal'])],
        [Paragraph(f'<font size="20" color="#4f46e5">{stats["drives_conducted"]}</font>', styles['Normal']),
         Paragraph(f'<font size="20" color="#4f46e5">{stats["total_applied"]}</font>', styles['Normal']),
         Paragraph(f'<font size="20" color="#10b981">{stats["total_selected"]}</font>', styles['Normal']),
         Paragraph(f'<font size="20" color="#f59e0b">{stats["total_shortlisted"]}</font>', styles['Normal'])]
    ]
    stat_table = Table(stat_data, colWidths=[doc.width/4]*4)
    stat_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f1f5f9')),
        ('TOPPADDING', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('ROUNDEDCORNERS', [5, 5, 5, 5]),
    ]))
    elements.append(stat_table)
    elements.append(Spacer(1, 20))

    # Detailed metrics table
    elements.append(Paragraph('Detailed Metrics', styles['SectionHeader']))
    detail_data = [
        ['Metric', 'Count'],
        ['Total Registered Students', str(stats['total_students'])],
        ['Total Approved Companies', str(stats['total_companies'])],
        ['Drives Conducted This Month', str(stats['drives_conducted'])],
        ['Applications This Month', str(stats['total_applied'])],
        ['Students Selected', str(stats['total_selected'])],
        ['Students Shortlisted', str(stats['total_shortlisted'])],
        ['Students Rejected', str(stats['total_rejected'])],
    ]
    detail_table = Table(detail_data, colWidths=[doc.width*0.65, doc.width*0.35])
    detail_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#4f46e5')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (1, 0), (1, -1), 'CENTER'),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(detail_table)
    elements.append(Spacer(1, 30))

    # Footer
    elements.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=10))
    elements.append(Paragraph(
        f'Generated on {stats["generated_at"]} — Placement Portal',
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9,
                       textColor=colors.HexColor('#94a3b8'), alignment=TA_CENTER)
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()


def generate_offer_letter_pdf(company_name, student_name, job_title, package_lpa, location, join_date=None):
    """
    Generate a dummy offer letter as a PDF.

    Returns:
        bytes: PDF file content
    """
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            topMargin=30*mm, bottomMargin=20*mm,
                            leftMargin=30*mm, rightMargin=30*mm)
    styles = _get_styles()
    elements = []

    today = datetime.utcnow().strftime('%d %B %Y')
    if not join_date:
        join_date = (datetime.utcnow() + timedelta(days=30)).strftime('%d %B %Y')

    # Company header
    elements.append(Paragraph(f'<b>{company_name}</b>', ParagraphStyle(
        'CompanyHeader', parent=styles['Title'],
        fontSize=24, textColor=colors.HexColor('#1e293b'), spaceAfter=4
    )))
    elements.append(HRFlowable(width='100%', thickness=3, color=colors.HexColor('#4f46e5'), spaceAfter=25))

    # Date and reference
    elements.append(Paragraph(f'Date: {today}', styles['Normal']))
    elements.append(Paragraph(f'Ref: OL/{datetime.utcnow().strftime("%Y%m%d")}/{student_name[:3].upper()}', styles['Normal']))
    elements.append(Spacer(1, 20))

    # Salutation
    elements.append(Paragraph(f'Dear <b>{student_name}</b>,', styles['Normal']))
    elements.append(Spacer(1, 12))

    # Offer body
    body = f"""
    We are pleased to extend this offer of employment for the position of <b>{job_title}</b>
    at <b>{company_name}</b>. After careful evaluation of your candidature during our campus
    recruitment drive, we are confident that your skills and qualifications make you an
    excellent fit for our organization.
    """
    elements.append(Paragraph(body, styles['Normal']))
    elements.append(Spacer(1, 15))

    # Terms table
    elements.append(Paragraph('<b>Terms of Employment</b>', styles['SectionHeader']))
    terms_data = [
        ['Position', job_title],
        ['Annual Compensation', f'₹ {package_lpa} LPA' if package_lpa else 'As discussed'],
        ['Location', location or 'To be confirmed'],
        ['Joining Date', join_date],
        ['Probation Period', '6 Months'],
    ]
    terms_table = Table(terms_data, colWidths=[doc.width*0.4, doc.width*0.6])
    terms_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f1f5f9')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
    ]))
    elements.append(terms_table)
    elements.append(Spacer(1, 20))

    # Closing
    closing = """
    Please confirm your acceptance of this offer by signing and returning a copy of this
    letter within 7 days from the date of receipt. We look forward to welcoming you to
    our team.
    """
    elements.append(Paragraph(closing, styles['Normal']))
    elements.append(Spacer(1, 25))

    elements.append(Paragraph('Warm regards,', styles['Normal']))
    elements.append(Spacer(1, 30))
    elements.append(Paragraph('____________________________', styles['Normal']))
    elements.append(Paragraph(f'<b>HR Department</b>', styles['Normal']))
    elements.append(Paragraph(f'{company_name}', styles['Normal']))

    # Footer
    elements.append(Spacer(1, 40))
    elements.append(HRFlowable(width='100%', thickness=1, color=colors.HexColor('#e2e8f0'), spaceAfter=8))
    elements.append(Paragraph(
        'This is a system-generated offer letter from the Placement Portal.',
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8,
                       textColor=colors.HexColor('#94a3b8'), alignment=TA_CENTER)
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
