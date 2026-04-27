package com.niranjan.certificates.service.impl;

import com.niranjan.certificates.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageServiceImpl implements FileStorageService {

    private static final Map<String, String> ALLOWED_IMAGE_TYPES = Map.of(
            "image/png", ".png",
            "image/jpeg", ".jpg",
            "image/webp", ".webp");
    private static final Set<String> ALLOWED_SUBFOLDERS = Set.of("logos", "signatures");

    @Value("${app.upload.dir}")
    private String uploadDir;

    @PostConstruct
    public void init() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    @Override
    public String saveFile(MultipartFile file, String subfolder) {
        try {
            validateFile(file, subfolder);

            Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path targetDir = uploadRoot.resolve(subfolder).normalize();
            if (!targetDir.startsWith(uploadRoot)) {
                throw new IllegalArgumentException("Invalid upload path");
            }
            Files.createDirectories(targetDir);

            String extension = ALLOWED_IMAGE_TYPES.get(file.getContentType().toLowerCase(Locale.ROOT));
            String filename = UUID.randomUUID() + extension;

            Path targetPath = targetDir.resolve(filename).normalize();
            if (!targetPath.startsWith(targetDir)) {
                throw new IllegalArgumentException("Invalid upload path");
            }
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return targetPath.toString();
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file", e);
        }
    }

    @Override
    public void deleteFile(String filePath) {
        try {
            Path uploadRoot = Paths.get(uploadDir).toAbsolutePath().normalize();
            Path path = Paths.get(filePath).toAbsolutePath().normalize();
            if (!path.startsWith(uploadRoot)) {
                throw new IllegalArgumentException("Invalid file path");
            }
            Files.deleteIfExists(path);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file", e);
        }
    }

    private void validateFile(MultipartFile file, String subfolder) {
        if (!ALLOWED_SUBFOLDERS.contains(subfolder)) {
            throw new IllegalArgumentException("Invalid upload destination");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.containsKey(contentType.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Only PNG, JPEG, and WebP images are allowed");
        }
    }
}
