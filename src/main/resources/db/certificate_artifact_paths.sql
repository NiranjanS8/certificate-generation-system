ALTER TABLE certificates
    ADD COLUMN IF NOT EXISTS pdf_url VARCHAR(255),
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(255);

UPDATE certificates
SET pdf_url = COALESCE(pdf_url, file_url)
WHERE file_url IS NOT NULL;

UPDATE certificates
SET image_url = COALESCE(image_url, regexp_replace(file_url, '\.pdf$', '.png'))
WHERE file_url IS NOT NULL;
