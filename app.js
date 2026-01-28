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
    const btnEncryptAct = document.getElementById('btn-encrypt-act');
    const btnDecryptAct = document.getElementById('btn-decrypt-act');
    const btnEncryptRule = document.getElementById('btn-encrypt-rule');
    const btnDecryptRule = document.getElementById('btn-decrypt-rule');

    // --- 常量定义 (凤凰系统专用) ---
    const PHOENIX_API_KEY = "PHOENIX-API-KEY!";
    const PHOENIX_API_IV = "PHOENIX-API-IV!!";
    const PHOENIX_RULE_KEY = "PHOENIX-RULE-KEY";
    const PHOENIX_RULE_IV = "PHOENIX-RULE-IV!";

    // --- 辅助函数 ---
    function showToast(message) { const toast = document.createElement('div'); toast.textContent = message; toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.7); color:white; padding:10px 20px; border-radius:5px; z-index:1000;'; document.body.appendChild(toast); setTimeout(() => { document.body.removeChild(toast); }, 2000); }

    // ====================  ↓↓↓ VOD线路仓的核心逻辑 (最终修复版) ↓↓↓ ====================
    function processKeyToWords(keyString) {
        return CryptoJS.enc.Utf8.parse(keyString.toString().padEnd(16, '0'));
    }

    /**
     * 【已被验证为正确】的VOD加密函数
     */
    function encryptVod(data, keyString, ivString) {
        const key = processKeyToWords(keyString);
        const iv = processKeyToWords(ivString);
        const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv });
        const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
        
        const keyHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(keyString));
        const ivHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(ivString));

        return "2423" + keyHex + "2324" + encryptedHex + ivHex;
    }

    /**
     * 【凯旋计划】最终的VOD解密核心
     * 严格遵循我们自己加密函数的拼接逻辑进行逆向解析
     */
    function decryptVod(ciphertext) {
        try {
            // 1. 【识别车架】检查并分离出各个部分
            if (!ciphertext.startsWith("2423") || !ciphertext.includes("2324")) {
                showToast("错误：密文格式不正确，缺少头部！");
                return null;
            }
            const separatorIndex = ciphertext.indexOf("2324");
            
            // 2. 【提取钥匙】从头部提取出原始的Key字符串
            const keyHex = ciphertext.substring(4, separatorIndex);
            const keyString = CryptoJS.enc.Hex.parse(keyHex).toString(CryptoJS.enc.Utf8);
            
            // 3. 【提取线索】从尾部提取出原始的IV字符串
            const bodyAndIvHex = ciphertext.substring(separatorIndex + 4);
            
            // ▼▼▼ 【关键约定】IV的Hex长度，等于Key的Hex长度！▼▼▼
            const ivHexLength = keyHex.length;
            
            if (bodyAndIvHex.length < ivHexLength) {
                showToast("错误：密文已损坏，长度不足！");
                return null;
            }

            const ivHex = bodyAndIvHex.substring(bodyAndIvHex.length - ivHexLength);
            const ivString = CryptoJS.enc.Hex.parse(ivHex).toString(CryptoJS.enc.Utf8);

            const encryptedHex = bodyAndIvHex.substring(0, bodyAndIvHex.length - ivHexLength);

            // 4. 【正确地开锁】用提取出的Key和IV，去解密主体
            const key = processKeyToWords(keyString);
            const iv = processKeyToWords(ivString);
            const ciphertextWords = CryptoJS.enc.Hex.parse(encryptedHex);
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertextWords }, key, { iv: iv });
            const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
            
            if (!decryptedText) return null;
            return decryptedText;
        } catch (e) {
            console.error("解密时发生致命错误:", e);
            return null;
        }
    }
    // ====================  ↑↑↑ VOD线路仓的核心逻辑 (最终修复版) ↑↑↑ ====================

    // 【凤凰系统】的加解密核心 (保持能用的原样)
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

    // --- 事件监听绑定 ---
    btnPaste.addEventListener('click', () => navigator.clipboard.readText().then(text => { mainInput.value = text; showToast('已粘贴'); }));
    btnCopy.addEventListener('click', () => { if(mainInput.value) navigator.clipboard.writeText(mainInput.value).then(() => showToast('已复制')); });
    btnClear.addEventListener('click', () => mainInput.value = "");
    
    btnEncryptVod.addEventListener('click', () => { 
        const key = vodKeyInput.value;
        const iv = vodIvInput.value;
        if (!key || !iv) {
            showToast('请输入VOD的Key和IV！');
            return;
        }
        mainInput.value = encryptVod(mainInput.value, key, iv); 
    });
    btnDecryptVod.addEventListener('click', () => { 
        // 解密时，不再需要外部输入Key和IV，因为它会从密文中自动提取
        const r = decryptVod(mainInput.value); 
        if(r) mainInput.value = r; else showToast('解密失败！');
    });

    // 凤凰系统按钮保持原样
    btnEncryptAct.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); });
    btnDecryptAct.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
    btnEncryptRule.addEventListener('click', () => { mainInput.value = encryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); });
    btnDecryptRule.addEventListener('click', () => { const r = decryptAes(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV); if(r) mainInput.value = r; else showToast('解密失败！'); });
});
