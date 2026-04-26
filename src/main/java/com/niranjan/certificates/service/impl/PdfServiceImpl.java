package com.niranjan.certificates.service.impl;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.draw.LineSeparator;
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

    @Override
    public String generateCertificate(Organization org, Recipient recipient, Signatory signatory,
                                       String certificateTitle, String uniqueCode) {
        // Ensure output directory exists
        Path outputDir = Paths.get(uploadDir, "certificates");
        try {
            Files.createDirectories(outputDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create certificates directory", e);
        }

        String filePath = outputDir.resolve(uniqueCode + ".pdf").toString();

        // Landscape A4: width=842, height=595
        Document document = new Document(PageSize.A4.rotate(), 60, 60, 40, 40);

        try {
            PdfWriter.getInstance(document, new FileOutputStream(filePath));
            document.open();

            // Fonts
            Font orgNameFont = new Font(Font.HELVETICA, 28, Font.BOLD, new Color(30, 58, 95));
            Font titleFont = new Font(Font.HELVETICA, 22, Font.BOLD, new Color(44, 62, 80));
            Font labelFont = new Font(Font.HELVETICA, 13, Font.NORMAL, new Color(100, 100, 100));
            Font nameFont = new Font(Font.HELVETICA, 26, Font.BOLD, new Color(22, 40, 70));
            Font courseFont = new Font(Font.HELVETICA, 16, Font.NORMAL, new Color(44, 62, 80));
            Font detailFont = new Font(Font.HELVETICA, 12, Font.NORMAL, new Color(80, 80, 80));
            Font codeFont = new Font(Font.COURIER, 10, Font.NORMAL, new Color(150, 150, 150));
            Font signatoryFont = new Font(Font.HELVETICA, 13, Font.BOLD, new Color(44, 62, 80));
            Font signatoryTitleFont = new Font(Font.HELVETICA, 11, Font.NORMAL, new Color(100, 100, 100));

            // ===== TOP SECTION =====
            document.add(spacer(30));

            // Organization name
            Paragraph orgParagraph = new Paragraph(org.getName(), orgNameFont);
            orgParagraph.setAlignment(Element.ALIGN_CENTER);
            document.add(orgParagraph);

            document.add(spacer(15));

            // Decorative line
            LineSeparator line = new LineSeparator();
            line.setLineColor(new Color(189, 155, 96));
            line.setLineWidth(1.5f);
            line.setPercentage(40);
            document.add(new Chunk(line));

            document.add(spacer(15));

            // Certificate title
            Paragraph titleParagraph = new Paragraph(certificateTitle, titleFont);
            titleParagraph.setAlignment(Element.ALIGN_CENTER);
            document.add(titleParagraph);

            // ===== MIDDLE SECTION =====
            document.add(spacer(25));

            Paragraph certifyLabel = new Paragraph("This is to certify that", labelFont);
            certifyLabel.setAlignment(Element.ALIGN_CENTER);
            document.add(certifyLabel);

            document.add(spacer(10));

            // Recipient name
            Paragraph recipientParagraph = new Paragraph(recipient.getFullName(), nameFont);
            recipientParagraph.setAlignment(Element.ALIGN_CENTER);
            document.add(recipientParagraph);

            document.add(spacer(10));

            Paragraph completedLabel = new Paragraph("has successfully completed", labelFont);
            completedLabel.setAlignment(Element.ALIGN_CENTER);
            document.add(completedLabel);

            document.add(spacer(8));

            // Course name
            Paragraph courseParagraph = new Paragraph(recipient.getCourseName(), courseFont);
            courseParagraph.setAlignment(Element.ALIGN_CENTER);
            document.add(courseParagraph);

            document.add(spacer(8));

            // Score / Grade (if present)
            StringBuilder details = new StringBuilder();
            if (recipient.getScore() != null) {
                details.append("Score: ").append(recipient.getScore());
            }
            if (recipient.getGrade() != null) {
                if (!details.isEmpty()) details.append("  |  ");
                details.append("Grade: ").append(recipient.getGrade());
            }
            if (!details.isEmpty()) {
                Paragraph detailParagraph = new Paragraph(details.toString(), detailFont);
                detailParagraph.setAlignment(Element.ALIGN_CENTER);
                document.add(detailParagraph);
                document.add(spacer(5));
            }

            // Completion date
            Paragraph dateParagraph = new Paragraph(
                    "Completed on: " + recipient.getCompletionDate().format(DATE_FMT), detailFont);
            dateParagraph.setAlignment(Element.ALIGN_CENTER);
            document.add(dateParagraph);

            // ===== BOTTOM SECTION =====
            document.add(spacer(35));

            // Signature placeholder line
            LineSeparator sigLine = new LineSeparator();
            sigLine.setLineColor(new Color(100, 100, 100));
            sigLine.setLineWidth(0.8f);
            sigLine.setPercentage(20);
            document.add(new Chunk(sigLine));

            document.add(spacer(5));

            // Signatory name + title
            Paragraph sigNameParagraph = new Paragraph(signatory.getName(), signatoryFont);
            sigNameParagraph.setAlignment(Element.ALIGN_CENTER);
            document.add(sigNameParagraph);

            if (signatory.getTitle() != null && !signatory.getTitle().isBlank()) {
                Paragraph sigTitleParagraph = new Paragraph(signatory.getTitle(), signatoryTitleFont);
                sigTitleParagraph.setAlignment(Element.ALIGN_CENTER);
                document.add(sigTitleParagraph);
            }

            document.add(spacer(20));

            // Certificate code
            Paragraph codeParagraph = new Paragraph("Certificate ID: " + uniqueCode, codeFont);
            codeParagraph.setAlignment(Element.ALIGN_CENTER);
            document.add(codeParagraph);

            document.close();
        } catch (DocumentException | IOException e) {
            throw new RuntimeException("Failed to generate certificate PDF", e);
        }

        return filePath;
    }

    private Paragraph spacer(float height) {
        Paragraph p = new Paragraph(" ");
        p.setSpacingBefore(height);
        return p;
    }
}
