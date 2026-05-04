package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.entity.Organization;
import com.niranjan.certificates.entity.Recipient;
import com.niranjan.certificates.entity.Signatory;
import com.niranjan.certificates.service.ImageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
public class ImageServiceImpl implements ImageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    private static final int WIDTH = 1754;
    private static final int HEIGHT = 1240;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMMM yyyy");

    private static final Color PRIMARY = new Color(30, 58, 95);
    private static final Color ACCENT = new Color(216, 90, 48);
    private static final Color DARK_TEXT = new Color(33, 33, 33);
    private static final Color GRAY_TEXT = new Color(120, 120, 120);
    private static final Color LIGHT_GRAY = new Color(200, 200, 200);
    private static final Color BG_LIGHT = new Color(245, 245, 245);

    @Override
    public String generateCertificateImage(Organization org, Recipient recipient, Signatory signatory,
                                           String certificateTitle, String uniqueCode) {
        Path outputDir = Paths.get(uploadDir, "certificates");
        try {
            Files.createDirectories(outputDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create certificates directory", e);
        }

        String filePath = outputDir.resolve(uniqueCode + ".png").toString();

        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        try {
            configureGraphics(g);
            drawBackground(g);
            drawHeader(g, org, uniqueCode);
            drawBody(g, recipient, certificateTitle);
            drawFooter(g, recipient, signatory);
        } finally {
            g.dispose();
        }

        try {
            ImageIO.write(image, "png", new File(filePath));
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate certificate image", e);
        }

        return filePath;
    }

    private void configureGraphics(Graphics2D g) {
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
    }

    private void drawBackground(Graphics2D g) {
        g.setColor(BG_LIGHT);
        g.fillRect(0, 0, WIDTH, HEIGHT);

        g.setColor(Color.WHITE);
        g.fillRect(42, 42, WIDTH - 84, HEIGHT - 84);

        g.setColor(PRIMARY);
        g.fillRect(42, 42, 6, HEIGHT - 84);
        g.fillRect(48, 46, WIDTH - 90, 2);
        g.fillRect(48, HEIGHT - 48, WIDTH - 90, 2);

        g.setColor(ACCENT);
        g.fillRect(WIDTH - 48, 46, 6, 6);

        g.setColor(new Color(PRIMARY.getRed(), PRIMARY.getGreen(), PRIMARY.getBlue(), 14));
        g.setStroke(new BasicStroke(2f));
        g.drawOval(WIDTH - 200, 76, 330, 330);
        g.drawOval(WIDTH - 235, 160, 190, 190);
    }

    private void drawHeader(Graphics2D g, Organization org, String uniqueCode) {
        int x = 166;
        int y = 120;

        drawImageIfPresent(g, org.getLogoUrl(), x, y - 42, 82, 82);

        g.setColor(PRIMARY);
        g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 30));
        g.drawString(nullToBlank(org.getName()).toUpperCase(), x + 110, y + 12);

        g.setColor(LIGHT_GRAY);
        g.setFont(new Font(Font.MONOSPACED, Font.PLAIN, 18));
        drawRightAligned(g, uniqueCode, WIDTH - 135, y + 5);
    }

    private void drawBody(Graphics2D g, Recipient recipient, String certificateTitle) {
        int x = 166;
        int y = 382;

        g.setColor(PRIMARY);
        g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 58));
        drawWrapped(g, certificateTitle, x, y, WIDTH - 330, 66, 2);

        g.setColor(ACCENT);
        g.fillRect(x, y + 48, 220, 5);

        g.setColor(GRAY_TEXT);
        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 24));
        g.drawString("Presented to", x, y + 125);

        g.setColor(DARK_TEXT);
        g.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 64));
        drawWrapped(g, recipient.getFullName(), x, y + 205, WIDTH - 330, 74, 2);

        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 26));
        g.setColor(GRAY_TEXT);
        drawWrapped(g, buildDescription(recipient), x, y + 300, WIDTH - 360, 40, 4);
    }

    private void drawFooter(Graphics2D g, Recipient recipient, Signatory signatory) {
        int top = HEIGHT - 315;
        int left = 166;
        int right = WIDTH - 166;

        g.setColor(new Color(220, 220, 220));
        g.setStroke(new BasicStroke(1.2f));
        g.drawLine(left, top, right, top);

        int dateX = left;
        int sigX = WIDTH - 590;
        int lineY = top + 118;

        g.setColor(GRAY_TEXT);
        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 22));
        g.drawLine(dateX, lineY, dateX + 300, lineY);
        g.drawString("DATE", dateX, lineY + 42);

        g.setColor(DARK_TEXT);
        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 25));
        g.drawString(recipient.getCompletionDate().format(DATE_FMT), dateX, lineY + 83);

        boolean signatureDrawn = drawImageIfPresent(g, signatory.getSignatureUrl(), sigX + 80, top + 36, 255, 84);
        if (!signatureDrawn) {
            g.setColor(GRAY_TEXT);
            g.drawLine(sigX + 130, lineY, sigX + 430, lineY);
        }

        g.setColor(GRAY_TEXT);
        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 22));
        drawRightAligned(g, "SIGNATURE", sigX + 430, lineY + 42);

        g.setColor(DARK_TEXT);
        g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 25));
        drawRightAligned(g, signatory.getName(), sigX + 430, lineY + 83);

        if (signatory.getTitle() != null && !signatory.getTitle().isBlank()) {
            g.setColor(GRAY_TEXT);
            g.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, 21));
            drawRightAligned(g, signatory.getTitle(), sigX + 430, lineY + 118);
        }
    }

    private String buildDescription(Recipient recipient) {
        StringBuilder description = new StringBuilder()
                .append("This is to certify that ")
                .append(recipient.getFullName())
                .append(" has successfully completed the course ")
                .append(recipient.getCourse().getName());

        if (recipient.getScore() != null || recipient.getGrade() != null) {
            description.append(" with ");
            if (recipient.getScore() != null) {
                description.append("a score of ").append(recipient.getScore());
            }
            if (recipient.getGrade() != null) {
                if (recipient.getScore() != null) {
                    description.append(" and ");
                }
                description.append("grade ").append(recipient.getGrade());
            }
        }

        description.append(" on ").append(recipient.getCompletionDate().format(DATE_FMT)).append(".");
        return description.toString();
    }

    private boolean drawImageIfPresent(Graphics2D g, String imagePath, int x, int y, int maxWidth, int maxHeight) {
        if (imagePath == null || imagePath.isBlank()) {
            return false;
        }

        try {
            BufferedImage source = ImageIO.read(new File(imagePath));
            if (source == null) {
                return false;
            }
            double scale = Math.min((double) maxWidth / source.getWidth(), (double) maxHeight / source.getHeight());
            int width = Math.max(1, (int) Math.round(source.getWidth() * scale));
            int height = Math.max(1, (int) Math.round(source.getHeight() * scale));
            int drawX = x + (maxWidth - width) / 2;
            int drawY = y + (maxHeight - height) / 2;
            g.drawImage(source, drawX, drawY, width, height, null);
            return true;
        } catch (IOException ignored) {
            return false;
        }
    }

    private void drawWrapped(Graphics2D g, String text, int x, int y, int maxWidth, int lineHeight, int maxLines) {
        FontMetrics metrics = g.getFontMetrics();
        List<String> lines = wrapText(nullToBlank(text), metrics, maxWidth, maxLines);
        for (int i = 0; i < lines.size(); i++) {
            g.drawString(lines.get(i), x, y + (i * lineHeight));
        }
    }

    private List<String> wrapText(String text, FontMetrics metrics, int maxWidth, int maxLines) {
        List<String> lines = new ArrayList<>();
        String[] words = text.trim().split("\\s+");
        StringBuilder line = new StringBuilder();

        for (String word : words) {
            String candidate = line.isEmpty() ? word : line + " " + word;
            if (metrics.stringWidth(candidate) <= maxWidth) {
                line = new StringBuilder(candidate);
                continue;
            }

            if (!line.isEmpty()) {
                lines.add(line.toString());
            }
            line = new StringBuilder(word);

            if (lines.size() == maxLines) {
                break;
            }
        }

        if (!line.isEmpty() && lines.size() < maxLines) {
            lines.add(line.toString());
        }

        if (lines.size() == maxLines && metrics.stringWidth(lines.get(maxLines - 1)) > maxWidth) {
            String clipped = lines.get(maxLines - 1);
            while (clipped.length() > 1 && metrics.stringWidth(clipped + "...") > maxWidth) {
                clipped = clipped.substring(0, clipped.length() - 1);
            }
            lines.set(maxLines - 1, clipped + "...");
        }

        return lines;
    }

    private void drawRightAligned(Graphics2D g, String text, int rightX, int baselineY) {
        String value = nullToBlank(text);
        int width = g.getFontMetrics().stringWidth(value);
        g.drawString(value, rightX - width, baselineY);
    }

    private String nullToBlank(String value) {
        return value == null ? "" : value;
    }
}
