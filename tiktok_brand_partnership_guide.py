from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER

OUTPUT = "/home/user/tikfluence/TikTok_Brand_Partnership_Guide.pdf"

doc = SimpleDocTemplate(
    OUTPUT,
    pagesize=A4,
    rightMargin=2*cm, leftMargin=2*cm,
    topMargin=2*cm, bottomMargin=2*cm
)

TIKTOK_BLACK = colors.HexColor("#010101")
TIKTOK_RED   = colors.HexColor("#FE2C55")
TIKTOK_CYAN  = colors.HexColor("#25F4EE")
LIGHT_GRAY   = colors.HexColor("#F5F5F5")
MID_GRAY     = colors.HexColor("#DDDDDD")
DARK_GRAY    = colors.HexColor("#444444")

styles = getSampleStyleSheet()

def style(name, **kw):
    return ParagraphStyle(name, **kw)

title_style = style("Title",
    fontSize=22, textColor=TIKTOK_RED, spaceAfter=4,
    fontName="Helvetica-Bold", alignment=TA_CENTER)

subtitle_style = style("Subtitle",
    fontSize=11, textColor=DARK_GRAY, spaceAfter=2,
    fontName="Helvetica", alignment=TA_CENTER)

section_style = style("Section",
    fontSize=13, textColor=TIKTOK_RED,
    fontName="Helvetica-Bold", spaceBefore=14, spaceAfter=4)

subsection_style = style("Subsection",
    fontSize=11, textColor=TIKTOK_BLACK,
    fontName="Helvetica-Bold", spaceBefore=8, spaceAfter=3)

body_style = style("Body",
    fontSize=9.5, textColor=DARK_GRAY,
    fontName="Helvetica", spaceAfter=4, leading=14)

bullet_style = style("Bullet",
    fontSize=9.5, textColor=DARK_GRAY,
    fontName="Helvetica", spaceAfter=3, leading=13,
    leftIndent=14, bulletIndent=4)

note_style = style("Note",
    fontSize=9, textColor=colors.HexColor("#666666"),
    fontName="Helvetica-Oblique", spaceAfter=4, leading=13)

source_style = style("Source",
    fontSize=8.5, textColor=colors.HexColor("#888888"),
    fontName="Helvetica", spaceAfter=2, leading=12)

def section(title):
    return [Paragraph(title, section_style),
            HRFlowable(width="100%", thickness=1.5, color=TIKTOK_RED, spaceAfter=4)]

def subsection(title):
    return [Paragraph(title, subsection_style)]

def body(text):
    return Paragraph(text, body_style)

def bullet(text):
    return Paragraph(f"• {text}", bullet_style)

def sp(h=6):
    return Spacer(1, h)

def table(data, col_widths, header=True):
    t = Table(data, colWidths=col_widths)
    base = [
        ("FONTNAME", (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE", (0,0), (-1,-1), 9),
        ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
        ("GRID", (0,0), (-1,-1), 0.4, MID_GRAY),
        ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
        ("LEFTPADDING", (0,0), (-1,-1), 7),
        ("RIGHTPADDING", (0,0), (-1,-1), 7),
        ("TOPPADDING", (0,0), (-1,-1), 5),
        ("BOTTOMPADDING", (0,0), (-1,-1), 5),
    ]
    if header:
        base += [
            ("BACKGROUND", (0,0), (-1,0), TIKTOK_BLACK),
            ("TEXTCOLOR", (0,0), (-1,0), colors.white),
            ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
            ("FONTSIZE", (0,0), (-1,0), 9.5),
        ]
    t.setStyle(TableStyle(base))
    return t

story = []

# ── COVER ──────────────────────────────────────────────────────────────────
story += [
    sp(20),
    Paragraph("TikTok Brand Partnership", title_style),
    Paragraph("on LIVE — Policy & Compliance Guide", title_style),
    sp(6),
    HRFlowable(width="60%", thickness=2, color=TIKTOK_CYAN, hAlign="CENTER"),
    sp(6),
    Paragraph("Global Rules · MENA / No-TikTok-Shop Regions · Quick Reference", subtitle_style),
    Paragraph("Based on TikTok Branded Content Policy (effective July 1 2025)", note_style.__class__("nc",
        fontSize=9, textColor=colors.HexColor("#999999"), fontName="Helvetica-Oblique",
        alignment=TA_CENTER, spaceAfter=4)),
    sp(30),
]

# ── SECTION 1 ──────────────────────────────────────────────────────────────
story += section("1. Core Rules for Brand Partnerships on TikTok LIVE")
story += subsection("Disclosure — Mandatory & Irreversible on LIVE")
story += [
    bullet("Turn on the <b>Commercial Content Disclosure toggle</b> <i>before</i> going LIVE."),
    bullet('Once live, the stream is labelled <b>"Paid Partnership"</b> or <b>"Promotional Content"</b> — this <b>cannot be changed</b> after the fact.'),
    bullet("Also add <b>#ad</b> or <b>#sponsored</b> at the <i>beginning</i> of the caption/description."),
    bullet("Missing disclosure = in-app warning within 2–3 hours; if not fixed in 24 h → removed from For You feed."),
    sp(4),
]

story += subsection("Brand Must Be Qualified")
story += [
    bullet("The brand needs a <b>Registered TikTok Business Account</b>."),
    bullet("Partnerships should go through <b>TikTok One / Creator Marketplace</b> where available."),
    bullet("For <b>restricted industries</b>, the brand needs explicit TikTok permission before you can promote them."),
    sp(4),
]

story += subsection("Product Must Be Clearly Identified")
story += [
    bullet("Name the product <b>verbally and/or in text</b> during the LIVE."),
    bullet("Viewers must understand what is being promoted <i>without</i> clicking your profile or any external link."),
    sp(4),
]

story += subsection("No False or Misleading Claims")
story += [
    bullet("No exaggerated results, fake testimonials, or misleading pricing."),
    bullet("No deceptive or false statements about how a product works."),
    sp(4),
]

story += subsection("Music Licensing")
story += [
    bullet("Only use music from TikTok's <b>Commercial Music Library (CML)</b> during a branded LIVE."),
    bullet("Non-CML music without a written licence → LIVE can be muted, taken down, or trigger a policy strike."),
    sp(4),
]

story += subsection("No External Redirects")
story += [
    bullet("Do not share personal contact info or redirect viewers to external sites in ways that violate community guidelines."),
    sp(4),
]

story += subsection("AI-Generated Content")
story += [
    bullet("Disclose any AI-generated or synthetic media used in the LIVE separately (enforced from 2025–2026 onwards)."),
    sp(8),
]

# ── SECTION 2 ──────────────────────────────────────────────────────────────
story += section("2. Prohibited Industries — Never Promote These")
story += [sp(4)]
story.append(table(
    [
        ["Category", "Examples"],
        ["Adult / Sexual products", "Pornography, sex toys, lubricants, fetish costumes"],
        ["Tobacco & Nicotine", "Cigarettes, e-cigarettes, vapes, nicotine patches"],
        ["Financial Services", "Loans, credit cards, investment/trading, insurance"],
        ["Animals", "Buying/selling animals, protected animal body parts"],
        ["Hazardous Chemicals", "Dangerous chemical products"],
        ["Human Organ Trade", "Any organ trade services"],
        ["Prenatal Sex Determination", "Gender selection services"],
        ["Highly Controversial", "International brides, violent or dangerous businesses"],
    ],
    [7*cm, 10*cm]
))
story += [sp(8)]

# ── SECTION 3 ──────────────────────────────────────────────────────────────
story += section("3. MENA & Regions Without TikTok Shop")
story += [
    body("TikTok Shop (in-app e-commerce) is <b>not available in MENA</b>, but <b>branded content is completely separate</b> from TikTok Shop. "
         "The Branded Content Policy applies globally — you can still do paid brand deals and product placement on LIVE."),
    sp(6),
]

story += subsection("What Is and Isn't Available in MENA")
story += [sp(4)]
story.append(table(
    [
        ["Feature", "Available in MENA"],
        ["TikTok Shop (in-app checkout)", "No"],
        ["Affiliate / commission links", "No"],
        ["LIVE Gifts from viewers", "Yes (90+ countries)"],
        ["Direct brand partnership deals", "Yes"],
        ["TikTok Creator Marketplace", "Yes (Saudi Arabia & UAE confirmed)"],
        ["Branded Content disclosure on LIVE", "Yes — required"],
    ],
    [9*cm, 8*cm]
))
story += [sp(6)]

story += subsection("How It Works Without TikTok Shop")
story += [
    bullet("Negotiate a flat-fee or gifted-product deal <b>directly with the brand</b>, or via TikTok Creator Marketplace."),
    bullet("Show and verbally promote the product during LIVE (classic product placement)."),
    bullet("You can <i>mention</i> where to buy (e.g. brand's website) but cannot use in-app affiliate links."),
    bullet("Same disclosure rules apply — enable the toggle before going LIVE."),
    sp(8),
]

# ── SECTION 4 ──────────────────────────────────────────────────────────────
story += section("4. Consequences of Violations")
story += [sp(4)]
story.append(table(
    [
        ["Violation", "Consequence"],
        ["No disclosure on a post/LIVE", "In-app warning; no fix within 24 h → removed from For You feed"],
        ["LIVE published without disclosure toggle", "Label cannot be added retroactively"],
        ["Repeated violations (6× in 90 days)", "E-commerce permissions removed, commissions frozen"],
        ["Serious / prohibited content", "Content removal, reach restriction, account suspension"],
        ["Non-CML music during branded LIVE", "LIVE muted, taken down, or policy strike"],
    ],
    [7.5*cm, 9.5*cm]
))
story += [sp(8)]

# ── SECTION 5 ──────────────────────────────────────────────────────────────
story += section("5. Pre-LIVE Checklist")
story += [sp(4)]
checklist_data = [
    ["#", "Check", "Done?"],
    ["1", "Commercial Content Disclosure toggle is ON before going live", "☐"],
    ["2", "Brand has a Registered TikTok Business Account", "☐"],
    ["3", "Deal arranged via TikTok One / Creator Marketplace (where available)", "☐"],
    ["4", "Product/service named clearly and verbally during the LIVE", "☐"],
    ["5", "Product is NOT in a prohibited industry", "☐"],
    ["6", "Only CML music playing in the background", "☐"],
    ["7", "No false or exaggerated claims about the product", "☐"],
    ["8", "No sharing of personal contact info or prohibited external redirects", "☐"],
    ["9", "AI-generated content disclosed if any is used", "☐"],
]
t2 = Table(checklist_data, colWidths=[1*cm, 13.5*cm, 2.5*cm])
t2.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,0), TIKTOK_BLACK),
    ("TEXTCOLOR", (0,0), (-1,0), colors.white),
    ("FONTNAME", (0,0), (-1,0), "Helvetica-Bold"),
    ("FONTNAME", (0,1), (-1,-1), "Helvetica"),
    ("FONTSIZE", (0,0), (-1,-1), 9),
    ("ROWBACKGROUNDS", (0,1), (-1,-1), [colors.white, LIGHT_GRAY]),
    ("GRID", (0,0), (-1,-1), 0.4, MID_GRAY),
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("ALIGN", (0,0), (0,-1), "CENTER"),
    ("ALIGN", (2,0), (2,-1), "CENTER"),
    ("LEFTPADDING", (0,0), (-1,-1), 7),
    ("RIGHTPADDING", (0,0), (-1,-1), 7),
    ("TOPPADDING", (0,0), (-1,-1), 5),
    ("BOTTOMPADDING", (0,0), (-1,-1), 5),
]))
story.append(t2)
story += [sp(12)]

# ── SOURCES ────────────────────────────────────────────────────────────────
story += section("Sources")
sources = [
    "TikTok Branded Content Policy — tiktok.com/legal/page/global/bc-policy/en",
    "Commercial Content Disclosure (Creators) — ads.tiktok.com/help/article/about-the-content-disclosure-setting-for-creators",
    "Promoting a brand, product or service — support.tiktok.com/en/business-and-creator/creator-and-business-accounts/promoting-a-brand-product-or-service",
    "TikTok LIVE powers MENA's retail & creator economy — gulfbusiness.com (2025)",
    "TikTok Creator Marketplace Guide 2026 — stackmatix.com/blog/tiktok-creator-marketplace-guide",
    "TikTok New Rules 2026 — darkroomagency.com/observatory/what-brands-need-to-know-about-tiktok-new-rules-2026",
    "Branded Content Policy Market-specific Requirements — ads.tiktok.com/help/article/branded-content-policy-country-specific-requirements",
]
for s in sources:
    story.append(Paragraph(f"• {s}", source_style))

story += [sp(6)]
story.append(Paragraph(
    "Document generated April 2026 · For the latest rules always check tiktok.com/legal",
    ParagraphStyle("footer", fontSize=8, textColor=colors.HexColor("#BBBBBB"),
                   fontName="Helvetica-Oblique", alignment=TA_CENTER)))

doc.build(story)
print(f"PDF saved to: {OUTPUT}")
