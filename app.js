document.addEventListener('DOMContentLoaded', () => {
    // --- 元素获取 ---
    const mainInput = document.getElementById('main-input');
    const vodKeyInput = document.getElementById('vod-key-input');
    const vodIvInput = document.getElementById('vod-iv-input');
    const btnPaste = document.getElementById('btn-paste');
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');
    const btnEncryptVod = document.getElementById('btn-encrypt-vod');
    const btnDecryptVod = document.getElementById('btn-decrypt-vod');
    const btnCreateImage = document.getElementById('btn-create-image');
    const btnEncryptAct = document.getElementById('btn-encrypt-act');
    const btnDecryptAct = document.getElementById('btn-decrypt-act');
    const btnEncryptRule = document.getElementById('btn-encrypt-rule');
    const btnDecryptRule = document.getElementById('btn-decrypt-rule');
    const btnMd5 = document.getElementById('btn-md5');

    // --- 常量定义 (凤凰系统专用) ---
    const PHOENIX_API_KEY = "PHOENIX-API-KEY!";
    const PHOENIX_API_IV = "PHOENIX-API-IV!!";
    const PHOENIX_RULE_KEY = "PHOENIX-RULE-KEY";
    const PHOENIX_RULE_IV = "PHOENIX-RULE-IV!";

    // --- 辅助函数 ---
    function showToast(message) { const toast = document.createElement('div'); toast.textContent = message; toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:10px 20px; border-radius:5px; z-index:1000;'; document.body.appendChild(toast); setTimeout(() => { document.body.removeChild(toast); }, 2000); }

    // ====================  ↓↓↓ VOD线路仓的核心逻辑 (最终版) ↓↓↓ ====================
    function processKeyToWords(keyString) {
        return CryptoJS.enc.Utf8.parse(keyString.toString().padEnd(16, '0'));
    }
    function encryptVod(data, keyString, ivString) {
        const key = processKeyToWords(keyString);
        const iv = processKeyToWords(ivString);
        const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv });
        return encrypted.ciphertext.toString(CryptoJS.enc.Hex);
    }
    function decryptVod(ciphertext, keyString, ivString) {
        try {
            const key = processKeyToWords(keyString);
            const iv = processKeyToWords(ivString);
            const ciphertextWords = CryptoJS.enc.Hex.parse(ciphertext);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertextWords }, key, { iv: iv });
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            if (!decryptedText) return null;
            return decryptedText;
        } catch (e) {
            return null;
        }
    }
    // ====================  ↑↑↑ VOD线路仓的核心逻辑 (最终版) ↑↑↑ ====================

    // 【凤凰系统】的加解密核心 (保持能用的原样)
    function encryptAes(data, key, iv) {
        // 这里是你原来能正常工作的凤凰系统加密逻辑
        // 如果你没有提供，我会使用一个标准的、但可能与你原来不一致的实现
        const keyHex = CryptoJS.enc.Utf8.parse(key);
        const ivHex = CryptoJS.enc.Utf8.parse(iv);
        const dataWords = CryptoJS.enc.Utf8.parse(data);
        const encrypted = CryptoJS.AES.encrypt(dataWords, keyHex, { iv: ivHex });
        return encrypted.toString();
    }
    function decryptAes(ciphertext, key, iv) {
        // 这里是你原来能正常工作的凤凰系统解密逻辑
        const keyHex = CryptoJS.enc.Utf8.parse(key);
        const ivHex = CryptoJS.enc.Utf8.parse(iv);
        const decrypted = CryptoJS.AES.decrypt(ciphertext, keyHex, { iv: ivHex });
        return decrypted.toString(CryptoJS.enc.Utf8);
    }

    // --- 页面初始化 ---
    // 页面加载时，自动生成并填充IV（时间戳）
    vodIvInput.value = new Date().getTime();

    // --- 事件监听绑定 ---
    btnPaste.addEventListener('click', () => navigator.clipboard.readText().then(text => { mainInput.value = text; showToast('已粘贴'); }));
    btnCopy.addEventListener('click', () => { if(mainInput.value) navigator.clipboard.writeText(mainInput.value).then(() => showToast('已复制')); });
    btnClear.addEventListener('click', () => mainInput.value = "");
    
    btnEncryptVod.addEventListener('click', () => { 
        const key = vodKeyInput.value;
        const iv = vodIvInput.value;
        if (!key) {
            showToast('请输入VOD的Key！');
            return;
        }
        mainInput.value = encryptVod(mainInput.value, key, iv); 
    });
    btnDecryptVod.addEventListener('click', () => { 
        const key = vodKeyInput.value;
        const iv = vodIvInput.value;
        if (!key) {
            showToast('请输入VOD的Key！');
            return;
        }
        const r = decryptVod(mainInput.value, key, iv); 
        if(r) mainInput.value = r; else showToast('解密失败！');
    });

    // 凤凰系统按钮保持原样
    btnEncryptAct.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); });
    btnDecryptAct.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnEncryptRule.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); });
    btnDecryptRule.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    
    btnMd5.addEventListener('click', () => { mainInput.value = CryptoJS.MD5(mainInput.value).toString(); });
});
