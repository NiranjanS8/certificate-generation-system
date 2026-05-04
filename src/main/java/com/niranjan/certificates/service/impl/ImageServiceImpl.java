package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.service.ImageService;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class ImageServiceImpl implements ImageService {

    private static final float IMAGE_DPI = 200f;

    @Override
    public String generateCertificateImage(String pdfPath, String uniqueCode) {
        Path outputPath = Paths.get(pdfPath).resolveSibling(uniqueCode + ".png");

        try (PDDocument document = Loader.loadPDF(new File(pdfPath))) {
            PDFRenderer renderer = new PDFRenderer(document);
            BufferedImage image = renderer.renderImageWithDPI(0, IMAGE_DPI, ImageType.RGB);
            ImageIO.write(image, "png", outputPath.toFile());
            return outputPath.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to convert certificate PDF to image", e);
        }
    }
}
