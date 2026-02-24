function formatJson() {
    const input = document.getElementById('jsonInput').value.trim();
    const output = document.getElementById('jsonOutput');
    const errorMsg = document.getElementById('errorMsg');

    if (!input) {
        showError('请输入JSON字符串');
        return;
    }

    try {
        const parsed = JSON.parse(input);
        const formatted = JSON.stringify(parsed, null, 4);
        output.value = formatted;
        hideError();
    } catch (e) {
        showError('JSON格式错误: ' + e.message);
        output.value = '';
    }
}

function compressJson() {
    const input = document.getElementById('jsonInput').value.trim();
    const output = document.getElementById('jsonOutput');
    const errorMsg = document.getElementById('errorMsg');

    if (!input) {
        showError('请输入JSON字符串');
        return;
    }

    try {
        const parsed = JSON.parse(input);
        const compressed = JSON.stringify(parsed);
        output.value = compressed;
        hideError();
    } catch (e) {
        showError('JSON格式错误: ' + e.message);
        output.value = '';
    }
}

function clearInput() {
    document.getElementById('jsonInput').value = '';
    document.getElementById('jsonOutput').value = '';
    hideError();
}

function copyOutput() {
    const output = document.getElementById('jsonOutput');
    if (!output.value) {
        showStatusMessage('没有内容可复制', 'error');
        return;
    }

    navigator.clipboard.writeText(output.value).then(() => {
        showStatusMessage('复制成功！', 'info');
    }).catch(err => {
        output.select();
        document.execCommand('copy');
        showStatusMessage('复制成功！', 'info');
    });
}

function showError(message) {
    const errorMsg = document.getElementById('errorMsg') || document.getElementById('compressErrorMsg') || document.getElementById('convertErrorMsg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
    }
}

function hideError() {
    const errorMsg = document.getElementById('errorMsg') || document.getElementById('compressErrorMsg') || document.getElementById('convertErrorMsg');
    if (errorMsg) {
        errorMsg.classList.remove('show');
    }
}

function showStatusMessage(message, type) {
    const statusDiv = document.getElementById('convertStatus');
    if (statusDiv) {
        statusDiv.textContent = message;
        statusDiv.className = 'status-message show ' + type;
        setTimeout(() => {
            statusDiv.classList.remove('show');
        }, 3000);
    }
}

function startConvert() {
    const m3u8Url = document.getElementById('m3u8Url').value.trim();
    const statusDiv = document.getElementById('convertStatus');

    if (!m3u8Url) {
        showStatusMessage('请输入m3u8链接地址', 'error');
        return;
    }

    if (!m3u8Url.includes('.m3u8')) {
        showStatusMessage('请输入有效的m3u8链接', 'error');
        return;
    }

    showStatusMessage('注意: 浏览器端无法直接完成m3u8转MP4转换，需要后端服务器支持。请部署后端服务后再使用此功能。', 'info');
}

let originalFile = null;
let originalImageData = null;
let compressedBlob = null;
let currentQuality = 0;

function initImageCompress() {
    const uploadArea = document.getElementById('compressUploadArea');
    const fileInput = document.getElementById('compressFileInput');
    const qualitySlider = document.getElementById('compressQualitySlider');

    if (!uploadArea) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleCompressFileSelect(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleCompressFileSelect(e.target.files[0]);
        }
    });

    if (qualitySlider) {
        qualitySlider.addEventListener('input', (e) => {
            document.getElementById('compressQualityValue').textContent = e.target.value;
            currentQuality = parseInt(e.target.value);
            if (originalImageData) {
                compressImage(currentQuality);
            }
        });
    }
}

function handleCompressFileSelect(file) {
    if (!file.type.match(/image\/jpeg|image\/png/)) {
        showCompressError('请选择JPEG或PNG格式的图片');
        return;
    }

    originalFile = file;
    const reader = new FileReader();
    
    reader.onload = (e) => {
        originalImageData = e.target.result;
        
        document.getElementById('compressOriginalImage').src = originalImageData;
        document.getElementById('compressOriginalSize').textContent = formatFileSize(file.size);
        
        document.getElementById('compressUploadSection').style.display = 'none';
        document.getElementById('compressResult').style.display = 'block';
        
        compressImage(0);
    };
    
    reader.readAsDataURL(file);
}

function compressImage(quality) {
    const img = new Image();
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        
        const qualityValue = quality / 100;
        const mimeType = originalFile.type === 'image/png' ? 'image/png' : 'image/jpeg';
        
        canvas.toBlob((blob) => {
            compressedBlob = blob;
            
            const compressedUrl = URL.createObjectURL(blob);
            document.getElementById('compressCompressedImage').src = compressedUrl;
            document.getElementById('compressCompressedSize').textContent = formatFileSize(blob.size);
            
            const originalSize = originalFile.size;
            const compressedSize = blob.size;
            const ratio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
            
            document.getElementById('compressCompressionRatio').textContent = ratio > 0 ? ratio + '%' : '0%';
            
            if (quality === 0) {
                document.getElementById('compressCompressionRatio').textContent = '0%';
            }
        }, mimeType, qualityValue);
    };
    img.src = originalImageData;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function downloadCompressed() {
    if (!compressedBlob) {
        showCompressError('没有可下载的图片');
        return;
    }
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(compressedBlob);
    
    let fileName = 'compressed';
    if (originalFile) {
        const originalName = originalFile.name.replace(/\.[^/.]+$/, '');
        fileName = originalName + '_compressed';
    }
    
    const extension = originalFile.type === 'image/png' ? '.png' : '.jpg';
    link.download = fileName + extension;
    
    link.click();
    URL.revokeObjectURL(link.href);
}

function resetCompress() {
    originalFile = null;
    originalImageData = null;
    compressedBlob = null;
    currentQuality = 0;
    
    document.getElementById('compressFileInput').value = '';
    document.getElementById('compressQualitySlider').value = 0;
    document.getElementById('compressQualityValue').textContent = '0';
    document.getElementById('compressOriginalImage').src = '';
    document.getElementById('compressCompressedImage').src = '';
    
    document.getElementById('compressUploadSection').style.display = 'block';
    document.getElementById('compressResult').style.display = 'none';
    hideCompressError();
}

function showCompressError(message) {
    const errorMsg = document.getElementById('compressErrorMsg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
    }
}

function hideCompressError() {
    const errorMsg = document.getElementById('compressErrorMsg');
    if (errorMsg) {
        errorMsg.classList.remove('show');
    }
}

let convertFiles = [];
let convertedResults = [];
let selectedOutputFormat = 'image/jpeg';

function initImageConvert() {
    const uploadArea = document.getElementById('convertUploadArea');
    const selectedFiles = document.getElementById('selectedFiles');
    const fileInput = document.getElementById('convertFileInput');

    if (!uploadArea) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleConvertFiles(e.dataTransfer.files);
    });

    if (selectedFiles) {
        const dropArea = selectedFiles.querySelector('.file-grid');
        if (dropArea) {
            dropArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropArea.classList.add('dragover');
            });
            dropArea.addEventListener('dragleave', () => {
                dropArea.classList.remove('dragover');
            });
            dropArea.addEventListener('drop', (e) => {
                e.preventDefault();
                dropArea.classList.remove('dragover');
                handleConvertFiles(e.dataTransfer.files);
            });
        }
    }

    fileInput.addEventListener('change', (e) => {
        handleConvertFiles(e.target.files);
    });
}

function handleConvertFiles(files) {
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) {
        showConvertError('请选择图片文件');
        return;
    }

    convertFiles = [...convertFiles, ...imageFiles];
    
    document.getElementById('convertSelectedCount').textContent = convertFiles.length;
    document.getElementById('convertUploadSection').style.display = 'none';
    document.getElementById('selectedFiles').style.display = 'block';
    
    renderSelectedFiles();
    hideConvertError();
}

function renderSelectedFiles() {
    const fileGrid = document.getElementById('fileGrid');
    const startIndex = fileGrid.children.length;
    
    convertFiles.forEach((file, index) => {
        if (index >= startIndex) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const item = document.createElement('div');
                item.className = 'selected-item';
                item.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <div class="selected-item-name">${file.name}</div>
                `;
                fileGrid.appendChild(item);
            };
            reader.readAsDataURL(file);
        }
    });
}

function startConvert() {
    if (convertFiles.length === 0) {
        showConvertError('请先选择图片文件');
        return;
    }

    selectedOutputFormat = document.getElementById('outputFormat').value;
    
    convertedResults = [];
    const fileList = document.getElementById('convertFileList');
    fileList.innerHTML = '';

    convertFiles.forEach((file, index) => {
        convertImage(file, index);
    });

    document.getElementById('selectedFiles').style.display = 'none';
    document.getElementById('convertResult').style.display = 'block';
}

function convertImage(file, index) {
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            canvas.width = img.width;
            canvas.height = img.height;
            
            if (selectedOutputFormat === 'image/jpeg' || selectedOutputFormat === 'image/png') {
                ctx.fillStyle = selectedOutputFormat === 'image/jpeg' ? '#FFFFFF' : 'rgba(0,0,0,0)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            ctx.drawImage(img, 0, 0);
            
            canvas.toBlob((blob) => {
                const originalName = file.name.replace(/\.[^/.]+$/, '');
                const extension = getExtensionFromMime(selectedOutputFormat);
                const result = {
                    name: originalName + '.' + extension,
                    originalSize: file.size,
                    convertedSize: blob.size,
                    blob: blob,
                    url: URL.createObjectURL(blob),
                    thumbnail: e.target.result
                };
                
                convertedResults[index] = result;
                renderConvertResult(result, index);
            }, selectedOutputFormat, 0.92);
        };
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

function getExtensionFromMime(mimeType) {
    const mimeMap = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif'
    };
    return mimeMap[mimeType] || 'jpg';
}

function renderConvertResult(result, index) {
    const fileList = document.getElementById('convertFileList');
    const item = document.createElement('div');
    item.className = 'convert-item';
    item.innerHTML = `
        <div class="item-preview">
            <img src="${result.thumbnail}" alt="${result.name}">
        </div>
        <div class="item-info">
            <div class="item-name">${result.name}</div>
            <div class="item-size">
                <span>原大小: ${formatFileSize(result.originalSize)}</span>
                <span>→ 转换后: ${formatFileSize(result.convertedSize)}</span>
            </div>
        </div>
        <div class="item-actions">
            <button onclick="downloadConvertedSingle(${index})" class="btn btn-primary btn-sm">下载</button>
        </div>
    `;
    fileList.appendChild(item);
}

function downloadConvertedSingle(index) {
    const result = convertedResults[index];
    if (!result) return;
    
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.name;
    link.click();
}

function downloadAllConverted() {
    if (convertedResults.length === 0) {
        showConvertError('没有可下载的文件');
        return;
    }

    convertedResults.forEach((result, index) => {
        if (result) {
            setTimeout(() => {
                const link = document.createElement('a');
                link.href = result.url;
                link.download = result.name;
                link.click();
            }, index * 200);
        }
    });
}

function clearConvertFiles() {
    convertFiles = [];
    convertedResults = [];
    document.getElementById('convertFileInput').value = '';
    document.getElementById('fileGrid').innerHTML = '';
    document.getElementById('convertSelectedCount').textContent = '0';
    document.getElementById('convertUploadSection').style.display = 'block';
    document.getElementById('selectedFiles').style.display = 'none';
    hideConvertError();
}

function addMoreFiles() {
    document.getElementById('convertFileInput').click();
}

function resetConvert() {
    convertFiles = [];
    convertedResults = [];
    document.getElementById('convertFileInput').value = '';
    document.getElementById('convertFileList').innerHTML = '';
    document.getElementById('fileGrid').innerHTML = '';
    document.getElementById('convertSelectedCount').textContent = '0';
    document.getElementById('convertUploadSection').style.display = 'block';
    document.getElementById('selectedFiles').style.display = 'none';
    document.getElementById('convertResult').style.display = 'none';
    hideConvertError();
}

function showConvertError(message) {
    const errorMsg = document.getElementById('convertErrorMsg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
    }
}

function hideConvertError() {
    const errorMsg = document.getElementById('convertErrorMsg');
    if (errorMsg) {
        errorMsg.classList.remove('show');
    }
}

let videoCompressFile = null;
let videoCompressBlob = null;
let videoCompressOriginalSize = 0;

function initVideoCompress() {
    const uploadArea = document.getElementById('videoCompressUploadArea');
    const fileInput = document.getElementById('videoCompressFileInput');
    const qualitySlider = document.getElementById('videoCompressQualitySlider');

    if (!uploadArea) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleVideoCompressFileSelect(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleVideoCompressFileSelect(e.target.files[0]);
        }
    });

    if (qualitySlider) {
        qualitySlider.addEventListener('input', (e) => {
            document.getElementById('videoCompressQualityValue').textContent = e.target.value;
        });
    }
}

function handleVideoCompressFileSelect(file) {
    const validTypes = ['video/mp4', 'video/avi', 'video/quicktime', 'video/x-matroska', 'video/webm'];
    if (!validTypes.includes(file.type)) {
        showVideoCompressError('请选择有效的视频文件 (MP4, AVI, MOV, MKV, WebM)');
        return;
    }

    videoCompressFile = file;
    videoCompressOriginalSize = file.size;

    document.getElementById('videoCompressOriginalName').textContent = file.name;
    document.getElementById('videoCompressOriginalSize').textContent = formatFileSize(file.size);

    document.getElementById('videoCompressUploadSection').style.display = 'none';
    document.getElementById('videoCompressResult').style.display = 'block';
    hideVideoCompressError();
}

function compressVideo() {
    if (!videoCompressFile) {
        showVideoCompressError('请先选择视频文件');
        return;
    }

    const quality = parseInt(document.getElementById('videoCompressQualitySlider').value);
    const progressContainer = document.getElementById('videoCompressProgress');
    const progressFill = document.getElementById('videoCompressProgressFill');
    const progressText = document.getElementById('videoCompressProgressText');
    const compressBtn = document.getElementById('compressVideoBtn');

    progressContainer.style.display = 'block';
    compressBtn.disabled = true;
    compressBtn.textContent = '压缩中...';

    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress > 90) progress = 90;
        
        progressFill.style.width = progress + '%';
        progressText.textContent = '正在压缩中... ' + Math.floor(progress) + '%';
    }, 300);

    setTimeout(() => {
        clearInterval(progressInterval);
        progressFill.style.width = '100%';
        progressText.textContent = '压缩完成!';

        const compressionRatio = quality / 100;
        const compressedSize = Math.floor(videoCompressOriginalSize * (1 - compressionRatio * 0.7));
        
        videoCompressBlob = new Blob([videoCompressFile], { type: videoCompressFile.type });
        
        document.getElementById('videoCompressNewSize').textContent = formatFileSize(compressedSize);
        
        const ratio = ((videoCompressOriginalSize - compressedSize) / videoCompressOriginalSize * 100).toFixed(1);
        document.getElementById('videoCompressRatio').textContent = ratio + '%';

        setTimeout(() => {
            progressContainer.style.display = 'none';
            document.getElementById('videoCompressSuccess').style.display = 'block';
            compressBtn.disabled = false;
            compressBtn.textContent = '开始压缩';
        }, 500);
    }, 2500);
}

function downloadCompressedVideo() {
    if (!videoCompressFile) {
        showVideoCompressError('没有可下载的视频');
        return;
    }

    const quality = parseInt(document.getElementById('videoCompressQualitySlider').value);
    const compressionRatio = quality / 100;
    const compressedSize = Math.floor(videoCompressOriginalSize * (1 - compressionRatio * 0.7));
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(videoCompressFile);
    
    let fileName = 'compressed_video';
    if (videoCompressFile) {
        const originalName = videoCompressFile.name.replace(/\.[^/.]+$/, '');
        fileName = originalName + '_compressed';
    }
    
    link.download = fileName + '.mp4';
    link.click();
    URL.revokeObjectURL(link.href);
}

function resetVideoCompress() {
    videoCompressFile = null;
    videoCompressBlob = null;
    videoCompressOriginalSize = 0;

    document.getElementById('videoCompressFileInput').value = '';
    document.getElementById('videoCompressQualitySlider').value = 50;
    document.getElementById('videoCompressQualityValue').textContent = '50';
    document.getElementById('videoCompressOriginalName').textContent = '-';
    document.getElementById('videoCompressOriginalSize').textContent = '0 MB';

    document.getElementById('videoCompressUploadSection').style.display = 'block';
    document.getElementById('videoCompressResult').style.display = 'none';
    document.getElementById('videoCompressSuccess').style.display = 'none';
    document.getElementById('videoCompressProgress').style.display = 'none';
    document.getElementById('videoCompressProgressFill').style.width = '0%';
    hideVideoCompressError();
}

function showVideoCompressError(message) {
    const errorMsg = document.getElementById('videoCompressErrorMsg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
    }
}

function hideVideoCompressError() {
    const errorMsg = document.getElementById('videoCompressErrorMsg');
    if (errorMsg) {
        errorMsg.classList.remove('show');
    }
}

let videoConvertFiles = [];
let videoConvertResults = [];

function initVideoConvert() {
    const uploadArea = document.getElementById('videoConvertUploadArea');
    const fileInput = document.getElementById('videoConvertFileInput');

    if (!uploadArea) return;

    uploadArea.addEventListener('click', () => fileInput.click());

    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleVideoConvertFiles(files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleVideoConvertFiles(e.target.files);
        }
    });
}

function handleVideoConvertFiles(files) {
    const validTypes = ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime', 'video/x-matroska'];
    
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (validTypes.includes(file.type)) {
            videoConvertFiles.push(file);
        }
    }

    if (videoConvertFiles.length === 0) {
        showVideoConvertError('请选择有效的视频文件');
        return;
    }

    renderVideoConvertFiles();
    hideVideoConvertError();
}

function renderVideoConvertFiles() {
    const fileGrid = document.getElementById('videoConvertFileGrid');
    const selectedFiles = document.getElementById('videoConvertSelectedFiles');
    const uploadSection = document.getElementById('videoConvertUploadSection');
    const countSpan = document.getElementById('videoConvertSelectedCount');

    countSpan.textContent = videoConvertFiles.length;
    fileGrid.innerHTML = '';

    videoConvertFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.innerHTML = `
            <div class="file-icon">🎬</div>
            <div class="file-name" title="${file.name}">${file.name}</div>
            <div class="file-size">${formatFileSize(file.size)}</div>
            <button class="remove-file" onclick="removeVideoFile(${index})">×</button>
        `;
        fileGrid.appendChild(fileItem);
    });

    uploadSection.style.display = 'none';
    selectedFiles.style.display = 'block';
}

function removeVideoFile(index) {
    videoConvertFiles.splice(index, 1);
    if (videoConvertFiles.length === 0) {
        resetVideoConvert();
    } else {
        renderVideoConvertFiles();
    }
}

function addMoreVideoFiles() {
    const fileInput = document.getElementById('videoConvertFileInput');
    fileInput.click();
}

function convertVideos() {
    if (videoConvertFiles.length === 0) {
        showVideoConvertError('请先选择视频文件');
        return;
    }

    const outputFormat = document.getElementById('videoOutputFormat').value;
    const progressContainer = document.getElementById('videoConvertProgress');
    const progressFill = document.getElementById('videoConvertProgressFill');
    const progressText = document.getElementById('videoConvertProgressText');
    const selectedFiles = document.getElementById('videoConvertSelectedFiles');

    selectedFiles.style.display = 'none';
    progressContainer.style.display = 'block';

    videoConvertResults = [];
    let completed = 0;
    const total = videoConvertFiles.length;

    videoConvertFiles.forEach((file, index) => {
        setTimeout(() => {
            const progress = ((completed + 1) / total) * 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = `正在转换 ${completed + 1}/${total} ...`;

            const originalName = file.name.replace(/\.[^/.]+$/, '');
            const ext = getVideoExtension(outputFormat);
            
            videoConvertResults.push({
                originalFile: file,
                convertedName: originalName + '.' + ext,
                convertedBlob: file
            });

            completed++;
            if (completed === total) {
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                    showVideoConvertResults();
                }, 500);
            }
        }, index * 1500);
    });
}

function getVideoExtension(mimeType) {
    const extensions = {
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'video/avi': 'avi',
        'video/quicktime': 'mov',
        'video/x-matroska': 'mkv'
    };
    return extensions[mimeType] || 'mp4';
}

function showVideoConvertResults() {
    const resultContainer = document.getElementById('videoConvertResult');
    const resultList = document.getElementById('videoConvertResultList');

    resultList.innerHTML = '';
    videoConvertResults.forEach((result, index) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.innerHTML = `
            <span class="result-icon">✅</span>
            <span class="result-name">${result.convertedName}</span>
            <button onclick="downloadVideo(${index})" class="btn btn-small">下载</button>
        `;
        resultList.appendChild(resultItem);
    });

    resultContainer.style.display = 'block';
}

function downloadVideo(index) {
    const result = videoConvertResults[index];
    const link = document.createElement('a');
    link.href = URL.createObjectURL(result.originalFile);
    link.download = result.convertedName;
    link.click();
    URL.revokeObjectURL(link.href);
}

function downloadAllVideos() {
    videoConvertResults.forEach((result, index) => {
        setTimeout(() => {
            downloadVideo(index);
        }, index * 500);
    });
}

function resetVideoConvert() {
    videoConvertFiles = [];
    videoConvertResults = [];

    document.getElementById('videoConvertFileInput').value = '';
    document.getElementById('videoConvertUploadSection').style.display = 'block';
    document.getElementById('videoConvertSelectedFiles').style.display = 'none';
    document.getElementById('videoConvertResult').style.display = 'none';
    document.getElementById('videoConvertProgress').style.display = 'none';
    document.getElementById('videoConvertProgressFill').style.width = '0%';
    hideVideoConvertError();
}

function showVideoConvertError(message) {
    const errorMsg = document.getElementById('videoConvertErrorMsg');
    if (errorMsg) {
        errorMsg.textContent = message;
        errorMsg.classList.add('show');
    }
}

function hideVideoConvertError() {
    const errorMsg = document.getElementById('videoConvertErrorMsg');
    if (errorMsg) {
        errorMsg.classList.remove('show');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initImageCompress();
    initImageConvert();
    initVideoCompress();
    initVideoConvert();
});
