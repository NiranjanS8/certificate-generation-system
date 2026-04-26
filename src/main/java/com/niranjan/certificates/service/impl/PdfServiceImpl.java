package com.niranjan.certificates.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.entity.Recipient;
import com.niranjan.certificates.entity.Signatory;
import com.niranjan.certificates.service.PdfService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class PdfServiceImpl implements PdfService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMMM yyyy");

    // Colors
    private static final Color PRIMARY = new Color(30, 58, 95);
    private static final Color ACCENT = new Color(211, 84, 0);
    private static final Color DARK_TEXT = new Color(33, 33, 33);
    private static final Color GRAY_TEXT = new Color(120, 120, 120);
    private static final Color LIGHT_GRAY = new Color(200, 200, 200);
    private static final Color BG_LIGHT = new Color(245, 245, 245);

    @Override
    public String generateCertificate(Organization org, Recipient recipient, Signatory signatory,
                                       String certificateTitle, String uniqueCode) {
        Path outputDir = Paths.get(uploadDir, "certificates");
        try {
            Files.createDirectories(outputDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create certificates directory", e);
        }

        String filePath = outputDir.resolve(uniqueCode + ".pdf").toString();

        // Landscape A4: 842 x 595 points — zero margins, we control everything
        Document document = new Document(PageSize.A4.rotate(), 0, 0, 0, 0);

        try {
            PdfWriter writer = PdfWriter.getInstance(document, new FileOutputStream(filePath));
            document.open();

            // ===== BACKGROUND DECORATIONS =====
            PdfContentByte canvas = writer.getDirectContentUnder();

            // Light gray page background
            canvas.setColorFill(BG_LIGHT);
            canvas.rectangle(0, 0, 842, 595);
            canvas.fill();

            // White content area
            canvas.setColorFill(Color.WHITE);
            canvas.rectangle(20, 20, 802, 555);
            canvas.fill();

            // Left accent bar
            canvas.setColorFill(ACCENT);
            canvas.rectangle(20, 20, 8, 555);
            canvas.fill();

            // Top accent line
            canvas.setColorFill(ACCENT);
            canvas.rectangle(28, 571, 794, 4);
            canvas.fill();

            // Bottom accent line
            canvas.setColorFill(PRIMARY);
            canvas.rectangle(28, 20, 794, 3);
            canvas.fill();

            // Decorative circles (top-right)
            PdfContentByte over = writer.getDirectContent();
            over.setColorFill(new Color(211, 84, 0, 30));
            over.circle(780, 520, 55);
            over.fill();
            over.setColorFill(new Color(211, 84, 0, 15));
            over.circle(800, 475, 35);
            over.fill();

            // ===== FONTS =====
            Font orgFont = new Font(Font.HELVETICA, 14, Font.BOLD, ACCENT);
            Font certLabelFont = new Font(Font.HELVETICA, 32, Font.BOLD, PRIMARY);
            Font subtitleFont = new Font(Font.HELVETICA, 12, Font.NORMAL, GRAY_TEXT);
            Font nameFont = new Font(Font.HELVETICA, 28, Font.BOLD, DARK_TEXT);
            Font bodyFont = new Font(Font.HELVETICA, 11, Font.NORMAL, GRAY_TEXT);
            Font bodyBoldFont = new Font(Font.HELVETICA, 11, Font.BOLD, DARK_TEXT);
            Font courseFont = new Font(Font.HELVETICA, 13, Font.BOLD, PRIMARY);
            Font detailFont = new Font(Font.HELVETICA, 10, Font.NORMAL, GRAY_TEXT);
            Font footerLabelFont = new Font(Font.HELVETICA, 8, Font.BOLD, GRAY_TEXT);
            Font footerValueFont = new Font(Font.HELVETICA, 11, Font.NORMAL, DARK_TEXT);
            Font codeFont = new Font(Font.COURIER, 8, Font.NORMAL, LIGHT_GRAY);

            // ===== 3-ROW LAYOUT TABLE =====
            PdfPTable layout = new PdfPTable(1);
            layout.setWidthPercentage(100);
            layout.setTotalWidth(842);
            layout.setLockedWidth(true);

            // ───── ROW 1: HEADER (logo + org name) — 80pt ─────
            PdfPCell headerCell = new PdfPCell();
            headerCell.setFixedHeight(80);
            headerCell.setBorder(Rectangle.NO_BORDER);
            headerCell.setPaddingLeft(80);
            headerCell.setPaddingTop(25);

            // Header with logo + org name side by side
            PdfPTable headerContent = new PdfPTable(2);
            headerContent.setWidthPercentage(100);
            headerContent.setWidths(new float[]{10, 90});

            // Logo cell
            PdfPCell logoCell = new PdfPCell();
            logoCell.setBorder(Rectangle.NO_BORDER);
            logoCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            if (org.getLogoUrl() != null && !org.getLogoUrl().isBlank()) {
                try {
                    Image logoImg = Image.getInstance(org.getLogoUrl());
                    logoImg.scaleToFit(40, 40);
                    logoCell.addElement(logoImg);
                } catch (Exception ignored) {
                    // Logo file missing — skip silently
                }
            }
            headerContent.addCell(logoCell);

            // Org name cell
            PdfPCell orgNameCell = new PdfPCell();
            orgNameCell.setBorder(Rectangle.NO_BORDER);
            orgNameCell.setVerticalAlignment(Element.ALIGN_MIDDLE);
            Paragraph orgName = new Paragraph(org.getName().toUpperCase(), orgFont);
            orgNameCell.addElement(orgName);
            headerContent.addCell(orgNameCell);

            headerCell.addElement(headerContent);
            layout.addCell(headerCell);

            // ───── ROW 2: BODY (title, name, description) — fills middle ─────
            PdfPCell bodyCell = new PdfPCell();
            bodyCell.setMinimumHeight(380); // 595 - 80 header - 135 footer
            bodyCell.setBorder(Rectangle.NO_BORDER);
            bodyCell.setPaddingLeft(80);
            bodyCell.setPaddingRight(80);
            bodyCell.setVerticalAlignment(Element.ALIGN_MIDDLE);

            // "CERTIFICATE" large title
            Paragraph certTitle = new Paragraph("CERTIFICATE", certLabelFont);
            certTitle.setSpacingAfter(2);
            bodyCell.addElement(certTitle);

            // Subtitle: "OF COMPLETION"
            String subtitleText = certificateTitle.toUpperCase().replace("CERTIFICATE", "").trim();
            if (!subtitleText.startsWith("OF")) {
                subtitleText = "OF " + subtitleText;
            }
            Paragraph subtitle = new Paragraph(subtitleText, subtitleFont);
            subtitle.setSpacingAfter(15);
            bodyCell.addElement(subtitle);

            // Thin divider line
            PdfPTable divider = new PdfPTable(1);
            divider.setWidthPercentage(25);
            divider.setHorizontalAlignment(Element.ALIGN_LEFT);
            PdfPCell dividerLine = new PdfPCell();
            dividerLine.setBorder(Rectangle.BOTTOM);
            dividerLine.setBorderColor(ACCENT);
            dividerLine.setBorderWidth(2f);
            dividerLine.setFixedHeight(1);
            divider.addCell(dividerLine);
            bodyCell.addElement(divider);

            // "Presented to" label
            Paragraph presentedTo = new Paragraph("Presented to", detailFont);
            presentedTo.setSpacingBefore(15);
            presentedTo.setSpacingAfter(5);
            bodyCell.addElement(presentedTo);

            // Recipient name (large, bold)
            Paragraph recipientName = new Paragraph(recipient.getFullName(), nameFont);
            recipientName.setSpacingAfter(15);
            bodyCell.addElement(recipientName);

            // Description paragraph with inline bold
            Paragraph description = new Paragraph();
            description.add(new Chunk("This is to certify that ", bodyFont));
            description.add(new Chunk(recipient.getFullName(), bodyBoldFont));
            description.add(new Chunk(" has successfully completed the course ", bodyFont));
            description.add(new Chunk(recipient.getCourse().getName(), courseFont));

            if (recipient.getScore() != null || recipient.getGrade() != null) {
                StringBuilder scoreText = new StringBuilder(" with ");
                if (recipient.getScore() != null) {
                    scoreText.append("a score of ").append(recipient.getScore());
                }
                if (recipient.getGrade() != null) {
                    if (recipient.getScore() != null) scoreText.append(" and ");
                    scoreText.append("grade ").append(recipient.getGrade());
                }
                description.add(new Chunk(scoreText.toString(), bodyFont));
            }

            description.add(new Chunk(" on " + recipient.getCompletionDate().format(DATE_FMT) + ".", bodyFont));
            description.setSpacingAfter(5);
            bodyCell.addElement(description);

            layout.addCell(bodyCell);

            // ───── ROW 3: FOOTER (date | code | signatory) — 135pt ─────
            PdfPCell footerCell = new PdfPCell();
            footerCell.setFixedHeight(135);
            footerCell.setBorder(Rectangle.TOP);
            footerCell.setBorderColor(new Color(220, 220, 220));
            footerCell.setBorderWidth(0.5f);
            footerCell.setPaddingLeft(80);
            footerCell.setPaddingRight(80);
            footerCell.setPaddingTop(15);

            // 3-column footer table
            PdfPTable footerTable = new PdfPTable(3);
            footerTable.setWidthPercentage(100);
            footerTable.setWidths(new float[]{30, 40, 30});

            // DATE column
            PdfPCell dateCol = new PdfPCell();
            dateCol.setBorder(Rectangle.NO_BORDER);
            dateCol.setPaddingTop(5);

            Paragraph dateLine = new Paragraph("_______________________", detailFont);
            dateCol.addElement(dateLine);

            Paragraph dateLabel = new Paragraph("DATE", footerLabelFont);
            dateLabel.setSpacingBefore(4);
            dateCol.addElement(dateLabel);

            Paragraph dateValue = new Paragraph(recipient.getCompletionDate().format(DATE_FMT), footerValueFont);
            dateCol.addElement(dateValue);

            footerTable.addCell(dateCol);

            // CERT CODE column (center)
            PdfPCell codeCol = new PdfPCell();
            codeCol.setBorder(Rectangle.NO_BORDER);
            codeCol.setVerticalAlignment(Element.ALIGN_BOTTOM);

            Paragraph code = new Paragraph(uniqueCode, codeFont);
            code.setAlignment(Element.ALIGN_CENTER);
            code.setSpacingBefore(35);
            codeCol.addElement(code);

            footerTable.addCell(codeCol);

            // SIGNATURE column
            PdfPCell sigCol = new PdfPCell();
            sigCol.setBorder(Rectangle.NO_BORDER);
            sigCol.setPaddingTop(5);

            // Render signature image if available
            if (signatory.getSignatureUrl() != null && !signatory.getSignatureUrl().isBlank()) {
                try {
                    Image sigImage = Image.getInstance(signatory.getSignatureUrl());
                    sigImage.scaleToFit(120, 40);
                    sigImage.setAlignment(Element.ALIGN_RIGHT);
                    sigCol.addElement(sigImage);
                } catch (Exception ignored) {
                    // Signature file missing — fall back to line
                    Paragraph sigLine = new Paragraph("_______________________", detailFont);
                    sigLine.setAlignment(Element.ALIGN_RIGHT);
                    sigCol.addElement(sigLine);
                }
            } else {
                Paragraph sigLine = new Paragraph("_______________________", detailFont);
                sigLine.setAlignment(Element.ALIGN_RIGHT);
                sigCol.addElement(sigLine);
            }

            Paragraph sigLabel = new Paragraph("SIGNATURE", footerLabelFont);
            sigLabel.setAlignment(Element.ALIGN_RIGHT);
            sigLabel.setSpacingBefore(4);
            sigCol.addElement(sigLabel);

            Paragraph sigName = new Paragraph(signatory.getName(), footerValueFont);
            sigName.setAlignment(Element.ALIGN_RIGHT);
            sigCol.addElement(sigName);

            if (signatory.getTitle() != null && !signatory.getTitle().isBlank()) {
                Paragraph sigTitle = new Paragraph(signatory.getTitle(), detailFont);
                sigTitle.setAlignment(Element.ALIGN_RIGHT);
                sigCol.addElement(sigTitle);
            }

            footerTable.addCell(sigCol);

            footerCell.addElement(footerTable);
            layout.addCell(footerCell);

            // ===== ADD LAYOUT TO DOCUMENT =====
            document.add(layout);

            document.close();
        } catch (DocumentException | IOException e) {
            throw new RuntimeException("Failed to generate certificate PDF", e);
        }

        return filePath;
    }
}
