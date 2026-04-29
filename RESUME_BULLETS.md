# HistoVision — Resume Bullet Points


- **Built HistoVision**, a full-stack tissue/microscopy image-analysis tool (FastAPI + React + MongoDB) implementing **segmentation, classification-style thresholding, color-space transformations and image quality assessment**, directly mirroring the WSI / tissue-specimen workflows described in the JD.

- Implemented an **image quality evaluation module** computing Laplacian-variance blur score, contrast (σ), brightness (μ), Sobel-gradient sharpness, signal-to-noise ratio (dB) and dynamic range — used to flag low-quality acquisitions before downstream analysis.

- Designed and validated a **multi-stage segmentation pipeline** combining Gaussian denoising, **Otsu's adaptive thresholding**, Gaussian-mean adaptive thresholding, and contour extraction (`cv2.findContours`) to isolate tissue structures and quantify region area & object counts.

- Engineered a **color-space transformation module** (RGB ↔ HSV ↔ Grayscale ↔ LAB) using OpenCV to study channel-specific information for stain separation and feature emphasis on H&E and fluorescence tissue samples.

- Built an **image enhancement pipeline** (CLAHE histogram equalization, Non-Local Means denoising, unsharp-mask sharpening) that improves perceived sharpness of microscopy images, with before/after comparison and quality metrics for algorithm validation.

- **Documented, tested and validated** all algorithms end-to-end: persisted every analysis to MongoDB with reproducible parameters, exposed a REST API (`/api/analyze`, `/api/history`), and shipped a clean React UI for visual algorithm review — matching the JD's "documentation, testing, validation" responsibility.

- Stack: **Python, OpenCV, NumPy, scikit-image, PIL, FastAPI, React, MongoDB**. Deployable on any Linux host; full source on GitHub.

---

### Talking points for interview

1. **Why Laplacian variance for blur?** Approximates the second derivative — sharper images have more high-frequency edge content, so variance is higher. Threshold ~100 is a common heuristic.
2. **Otsu vs Adaptive thresholding?** Otsu picks one global threshold by minimizing intra-class variance — works on uniform lighting. Adaptive computes a local threshold per pixel — works on uneven illumination (typical in microscopy).
3. **CLAHE vs global histogram eq?** CLAHE divides the image into tiles, equalizes each, and clips the histogram to limit noise amplification.
4. **Color spaces — why HSV / LAB?** HSV separates color from intensity; LAB is perceptually uniform — both are useful for stain separation.
5. **SNR computation?** Mean / std of the grayscale signal, expressed in dB.
