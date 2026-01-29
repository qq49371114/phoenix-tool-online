// app.js (By 婉儿 - 最终修复按钮点击)
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

    // LSB 辅助函数（已移除隐写和解密本体，仅保留辅助）
    function extractCipherText(imageTextString) {
        const separator = '**';
        const parts = imageTextString.split(separator);
        if (parts.length < 2) return null;
        return parts[1];
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

    // --- 凤凰系统加解密核心 (省略，保持不变) ---
    function encryptAes(data, key, iv) {
        const keyHex = CryptoJS.enc.Utf8.parse(key);
        const ivHex = CryptoJS.enc.Utf8.parse(iv);
        const dataWords = CryptoJS.enc.Utf8.parse(data);
        const encrypted = CryptoJS.AES.encrypt(dataWords, keyHex, { iv: iv });
        return encrypted.toString();
    }
    function decryptAes(ciphertext, key, iv) {
        try {
            const keyHex = CryptoJS.enc.Utf8.parse(key);
            const ivHex = CryptoJS.enc.Utf8.parse(iv);
            const decrypted = CryptoJS.AES.decrypt(ciphertext, keyHex, { iv: iv Hex });
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

    // --- “配置转图片”隐写事件 (数据流拼接模式) ---
    
    // 按钮点击触发文件选择
    if(btnImageEncode && imageFileInputEncode) btnImageEncode.addEventListener('click', () => {
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
        
        // 1. 对 VOD 密文进行二次 Base64 编码 (三层编码的第二层)
        const vodCipherWords = CryptoJS.enc.Utf8.parse(textToHide);
        const secondaryBase64 = CryptoJS.enc.Base64.stringify(vodCipherWords);

        const reader = new FileReader();
        reader.onload = function(e) {
            // 2. 提取图片的 Base64 内容
            const imageBase64 = e.target.result.split(',')[1];
            
            // 3. 拼接核心数据：图片 Base64 + ** + 二次 Base64 密文
            const finalOutput = imageBase64 + "**" + secondaryBase64;

            // 4. 触发下载
            const blob = new Blob([finalOutput], { type: 'text/plain' }); 
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'waner_config_image.bmp'; // 强制后缀为 BMP
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('配置字符串已生成并下载为 BMP 文件！');
        };
        reader.readAsDataURL(file); // 读取为 Base64 格式
    });

    // --- 提取图片密文（解密）事件 (数据流拼接模式) ---

    // 按钮点击触发文件选择
    if(btnImageDecode && imageFileInputDecode) btnImageDecode.addEventListener('click', () => {
         imageFileInputDecode.click();
    });

    // 文件选择后处理解密
    if(imageFileInputDecode) imageFileInputDecode.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const fullString = e.target.result;
            const separator = '**';
            const parts = fullString.split(separator);

            if (parts.length >= 2) {
                // 提取二次 Base64 密文 (清理多余前缀)
                const extractedBase64Cipher = parts[1].replace(/CAOSBjTG/g, '').trim(); 

                try {
                    // 1. Base64 解码，还原成 VOD 密文（Hex）
                    const vodCipherWords = CryptoJS.enc.Base64.parse(extractedBase64Cipher);
                    let vodCipherText = vodCipherWords.toString(CryptoJS.enc.Utf8);
                    
                    // 2. 最终清理
                    vodCipherText = vodCipherText.replace(/[\u0000-\u001F]+/g, '').trim();
                    
                    mainInput.value = vodCipherText;
                    showToast('密文已从拼接文件中完美提取！');
                } catch (err) {
                    console.error("Base64 解码失败:", err);
                    showToast('密文提取失败，Base64 格式错误。');
                }
            } else {
                showToast('提取失败，未找到分隔符 **。');
            }
        };
        reader.readAsText(file); // 读取为纯文本
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
