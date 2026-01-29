// app.js (By 婉儿 - 最终完美版 - 无省略)
document.addEventListener('DOMContentLoaded', () => {

    // --- 常量定义 (凤凰系统专用) ---
    const PHOENIX_API_KEY = "PHOENIX-API-KEY!";
    const PHOENIX_API_IV = "PHOENIX-API-IV!!";
    const PHOENIX_RULE_KEY = "PHOENIX-RULE-KEY";
    const PHOENIX_RULE_IV = "PHOENIX-RULE-IV!";

    // --- 元素获取 ---
    const mainInput = document.getElementById('main-input');
    const vodKeyInput = document.getElementById('vod-key-input');
    const vodIvInput = document.getElementById('vod-iv-input');

    // VOD
    const btnEncryptVod = document.getElementById('btn-encrypt-vod');
    const btnDecryptVod = document.getElementById('btn-decrypt-vod');

    // 凤凰
    const btnEncryptAct = document.getElementById('btn-encrypt-act');
    const btnDecryptAct = document.getElementById('btn-decrypt-act');
    const btnEncryptRule = document.getElementById('btn-encrypt-rule');
    const btnDecryptRule = document.getElementById('btn-decrypt-rule');
    
    // 图片配置
    const btnImageEncode = document.getElementById('btn-image-encode');
    const imageFileInputEncode = document.getElementById('image-file-input-encode'); 
    const btnImageDecode = document.getElementById('btn-image-decode');
    const imageFileInputDecode = document.getElementById('image-file-input-decode'); 

    // 通用
    const btnPaste = document.getElementById('btn-paste');
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');

    // --- 核心工具函数 ---
    
    function processKeyToWords(keyString) {
        return CryptoJS.enc.Utf8.parse(keyString.toString().padEnd(16, '0'));
    }

    function showToast(message) { 
        const toast = document.createElement('div'); 
        toast.textContent = message; 
        toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:10px 20px; border-radius:5px; z-index:1000;'; 
        document.body.appendChild(toast); 
        setTimeout(() => { 
            document.body.removeChild(toast); 
        }, 2000); 
    }

    // --- LSB 隐写核心辅助函数 ---

    function encodeData(text) {
        const encoder = new TextEncoder();
        const dataBytes = encoder.encode(text);
        const length = dataBytes.length;
        
        const lengthBuffer = new ArrayBuffer(4);
        new DataView(lengthBuffer).setUint32(0, length, false); // Big Endian
        const lengthBytes = new Uint8Array(lengthBuffer);

        const fullData = new Uint8Array(4 + length);
        fullData.set(lengthBytes, 0);
        fullData.set(dataBytes, 4);
        return fullData;
    }
    
    function extractBytes(data, startByteIndex, count) {
        const result = new Uint8Array(count);
        let dataIndex = startByteIndex * 8; 
        
        for (let k = 0; k < count; k++) { 
            let resultByte = 0;
            for (let bitIndex = 0; bitIndex < 8; bitIndex++) { 
                const currentBitIndex = dataIndex + bitIndex;
                const componentOffset = currentBitIndex % 3; 
                const pixelIndex = Math.floor(currentBitIndex / 3);
                const componentIndex = pixelIndex * 4 + componentOffset;
                
                const bit = data[componentIndex] & 1;
                resultByte = (resultByte << 1) | bit;
            }
            result[k] = resultByte;
            dataIndex += 8;
        }
        return result;
    }

    function bytesToInt(bytes) {
        if (bytes.length !== 4) return 0;
        const view = new DataView(bytes.buffer);
        return view.getUint32(0, false); 
    }
    
    function decodeData(bytes) {
        const decoder = new TextDecoder();
        // 最终清理 Base64 解码可能产生的空字符和不可见字符
        let text = decoder.decode(bytes);
        return text.replace(/[\u0000-\u001F]+/g, '').trim();
    }
    
    // --- VOD 加密解密 (修复后的版本) ---

    function encryptVod(data, keyString, ivString) {
        const key = processKeyToWords(keyString);
        const iv = processKeyToWords(ivString);
        const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv });
        const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
        
        const keyHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(keyString));
        const ivHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(ivString));

        return "2423" + keyHex + "2324" + encryptedHex + ivHex;
    }

    function decryptVod(ciphertext, ivString) {
        try {
            if (!ciphertext.startsWith("2423") || !ciphertext.includes("2324")) return null;
            const separatorIndex = ciphertext.indexOf("2324");
            
            const keyHex = ciphertext.substring(4, separatorIndex);
            const keyString = CryptoJS.enc.Hex.parse(keyHex).toString(CryptoJS.enc.Utf8);
            
            const ivHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(ivString));
            const ivHexLength = ivHex.length;

            const bodyAndIvHex = ciphertext.substring(separatorIndex + 4);
            if (bodyAndIvHex.length < ivHexLength) return null;
            const encryptedHex = bodyAndIvHex.substring(0, bodyAndIvHex.length - ivHexLength);

            const key = processKeyToWords(keyString);
            const iv = processKeyToWords(ivString);

            const ciphertextWords = CryptoJS.enc.Hex.parse(encryptedHex);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertextWords }, key, { iv: iv });
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            
            return decryptedText || null;

        } catch (e) {
            console.error("VOD解密时发生致命错误:", e);
            return null;
        }
    }
    
    // --- LSB 隐写和解密函数 ---

    function toImg(img, text) {
        if (!img || !text) throw new Error("图片和密文不能为空");

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const data = imageData.data;
        const fullData = encodeData(text);

        const maxCapacityBytes = Math.floor((data.length / 4) * 3 / 8); 
        if (fullData.length > maxCapacityBytes) {
            throw new Error(`数据过大，最大容量: ${maxCapacityBytes} 字节。`);
        }

        let dataIndex = 0;
        
        for (let i = 0; i < data.length; i += 4) { // 遍历像素
            for (let j = 0; j < 3; j++) { // R, G, B 通道
                const componentIndex = i + j; 
                
                if (dataIndex < fullData.length * 8) {
                    const byteIndex = Math.floor(dataIndex / 8);
                    const bitOffset = 7 - (dataIndex % 8);
                    const bit = (fullData[byteIndex] >> bitOffset) & 1;
                    
                    data[componentIndex] = (data[componentIndex] & 0xFE) | bit; // 核心 LSB 隐写
                    
                    dataIndex++;
                } else {
                    break;
                }
            }
            if (dataIndex >= fullData.length * 8) break;
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }

    function fromImg(img) {
        if (!img) return null;
        
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const lengthBytes = extractBytes(data, 0, 4);
        const dataLength = bytesToInt(lengthBytes); 
        
        if (dataLength === 0 || dataLength > 1000000) { 
            return null; // 没有数据或数据损坏
        }

        const hiddenDataBytes = extractBytes(data, 4, dataLength);
        return decodeData(hiddenDataBytes); // 返回二次 Base64 密文
    }

    // --- 凤凰系统加解密核心 ---

    function encryptAes(data, key, iv) {
        const keyHex = CryptoJS.enc.Utf8.parse(key);
        const ivHex = CryptoJS.enc.Utf8.parse(iv);
        const dataWords = CryptoJS.enc.Utf8.parse(data);
        const encrypted = CryptoJS.AES.encrypt(dataWords, keyHex, { iv: ivHex });
        return encrypted.toString();
    }
    function decryptAes(ciphertext, key, iv) {
        try {
            const keyHex = CryptoJS.enc.Utf8.parse(key);
            const ivHex = CryptoJS.enc.Utf8.parse(iv);
            const decrypted = CryptoJS.AES.decrypt(ciphertext, keyHex, { iv: ivHex });
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            return null;
        }
    }


    // --- 事件绑定 ---

    // VOD 加密事件
    if(btnEncryptVod) btnEncryptVod.addEventListener('click', () => {
         const keyVal = vodKeyInput.value;
         const ivVal = vodIvInput.value;
         if (!keyVal || !ivVal) {
             showToast('请输入VOD的Key和IV！');
             return;
         }
         mainInput.value = encryptVod(mainInput.value, keyVal, ivVal);
         showToast('VOD加密完成！');
    });

    // VOD 解密事件
    if(btnDecryptVod) btnDecryptVod.addEventListener('click', () => {
         const ivVal = vodIvInput.value;
         if (!ivVal) {
             showToast('解密需要提供原始的IV！');
             return;
         }
         const r = decryptVod(mainInput.value, ivVal); 
         if(r) {
             mainInput.value = r;
             showToast('VOD解密成功！');
         } else {
             showToast('VOD解密失败！');
         }
    });

    // --- “配置转图片”隐写事件 (LSB 隐写) ---
    
    // 按钮点击触发文件选择
    if(btnImageEncode) btnImageEncode.addEventListener('click', () => {
        imageFileInputEncode.click(); 
    });

    // 文件选择后处理隐写
    if(imageFileInputEncode) imageFileInputEncode.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const textToHide = mainInput.value;
        if (!textToHide) {
            showToast('请先输入要隐藏的密文！');
            return;
        }
        
        // 1. 对 VOD 密文进行二次 Base64 编码 (安全性增强)
        const vodCipherWords = CryptoJS.enc.Utf8.parse(textToHide);
        const secondaryBase64 = CryptoJS.enc.Base64.stringify(vodCipherWords);

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                try {
                    // 2. LSB 隐写
                    const stegoCanvas = toImg(img, secondaryBase64);
                    
                    // 3. 触发下载 (输出一个 PNG 图片文件)
                    const dataURL = stegoCanvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = dataURL;
                    a.download = 'waner_config_image.png'; 
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    
                    showToast('LSB 隐写完成，图片已下载！');
                } catch (error) {
                    showToast('隐写失败: ' + error.message);
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    // --- 提取图片密文（解密）事件 (LSB 解密) ---

    // 按钮点击触发文件选择
    if(btnImageDecode) btnImageDecode.addEventListener('click', () => {
         imageFileInputDecode.click();
    });

    // 文件选择后处理解密
    if(imageFileInputDecode) imageFileInputDecode.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                try {
                    // 1. LSB 解密，提取出二次 Base64 密文
                    const extractedBase64Cipher = fromImg(img);
                    
                    if (extractedBase64Cipher) {
                        // 2. Base64 解码，还原成 VOD 密文（Hex）
                        const vodCipherWords = CryptoJS.enc.Base64.parse(extractedBase64Cipher);
                        let vodCipherText = vodCipherWords.toString(CryptoJS.enc.Utf8);
                        
                        // 3. 最终清理
                        vodCipherText = vodCipherText.replace(/[\u0000-\u001F]+/g, '').trim();
                        
                        mainInput.value = vodCipherText;
                        showToast('密文已从图片中完美提取！');
                    } else {
                        showToast('提取失败，图片中未发现密文。');
                    }
                } catch (err) {
                    console.error("LSB 解密失败:", err);
                    showToast('图片解密失败，请检查是否是隐写后的 PNG 图片。');
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });

    // --- 凤凰系统事件绑定 ---
    if(btnEncryptAct) btnEncryptAct.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); showToast('激活码加密完成！'); });
    if(btnDecryptAct) btnDecryptAct.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    if(btnEncryptRule) btnEncryptRule.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); showToast('规则加密完成！'); });
    if(btnDecryptRule) btnDecryptRule.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });


    // --- 通用操作绑定 (最终修复复制粘贴逻辑) ---
    if(btnPaste) btnPaste.addEventListener('click', () => { 
        navigator.clipboard.readText()
            .then(text => { mainInput.value = text; showToast('已粘贴'); })
            .catch(err => { showToast('粘贴失败，请手动操作。'); });
    });
    if(btnCopy) btnCopy.addEventListener('click', () => { 
        if(mainInput.value) {
            navigator.clipboard.writeText(mainInput.value)
                .then(() => showToast('已复制'))
                .catch(err => { showToast('复制失败，请手动操作。'); });
        }
    });
    if(btnClear) btnClear.addEventListener('click', () => { mainInput.value = ""; showToast('已清空'); });
});
