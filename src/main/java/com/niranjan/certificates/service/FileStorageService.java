package com.niranjan.certificates.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

    /**
     * Save a file to uploads/{subfolder}/ directory.
     * @return relative file path from project root
     */
    String saveFile(MultipartFile file, String subfolder);

    /**
     * Delete a file from disk.
     */
    void deleteFile(String filePath);
}
