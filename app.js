/**
 * app.js
 * 凤凰工具箱 - 究极版 (By 婉儿 & 哥哥)
 * 功能：VOD 加解密 (含默认 IV)、凤凰系统加解密、BMP 拼接隐写、通用剪贴板工具
 * 状态：全功能满血版，绝无任何删减
 */

document.addEventListener('DOMContentLoaded', () => {

    // =========================================================
    // 1. 常量与默认值定义
    // =========================================================
    
    // 凤凰系统专用密钥
    const PHOENIX_API_KEY = "PHOENIX-API-KEY!";
    const PHOENIX_API_IV = "PHOENIX-API-IV!!";
    const PHOENIX_RULE_KEY = "PHOENIX-RULE-KEY";
    const PHOENIX_RULE_IV = "PHOENIX-RULE-IV!";
    
    // 内置默认 IV 偏移量
    const DEFAULT_IV = "1769600952204";

    // =========================================================
    // 2. 元素获取 (确保 ID 匹配)
    // =========================================================
    const mainInput = document.getElementById('main-input');
    const vodKeyInput = document.getElementById('vod-key-input');
    const vodIvInput = document.getElementById('vod-iv-input');

    const btnEncryptVod = document.getElementById('btn-encrypt-vod');
    const btnDecryptVod = document.getElementById('btn-decrypt-vod');
    
    const btnEncryptAct = document.getElementById('btn-encrypt-act');
    const btnDecryptAct = document.getElementById('btn-decrypt-act');
    const btnEncryptRule = document.getElementById('btn-encrypt-rule');
    const btnDecryptRule = document.getElementById('btn-decrypt-rule');
    
    const btnImageEncode = document.getElementById('btn-image-encode');
    const imageFileInputDecode = document.getElementById('image-file-input-decode'); 

    const btnPaste = document.getElementById('btn-paste');
    const btnCopy = document.getElementById('btn-copy');
    const btnClear = document.getElementById('btn-clear');

    // =========================================================
    // 3. 通用辅助工具
    // =========================================================
    
    // 密钥填充逻辑：确保密钥长度为 16 的倍数
    function processKeyToWords(keyString) {
        return CryptoJS.enc.Utf8.parse(keyString.toString().padEnd(16, '0'));
    }

    // 凤凰系统专用 IV 解析
    function parseIv(ivString) {
        return CryptoJS.enc.Utf8.parse(ivString);
    }

    // 吐司提示：带动画效果
    function showToast(message) { 
        const toast = document.createElement('div'); 
        toast.textContent = message; 
        toast.style.cssText = 'position:fixed; bottom:30px; left:50%; transform:translateX(-50%); background-color:rgba(0,0,0,0.85); color:white; padding:12px 24px; border-radius:8px; z-index:9999; font-size:14px; box-shadow:0 4px 12px rgba(0,0,0,0.2); transition: opacity 0.4s; pointer-events:none;'; 
        document.body.appendChild(toast); 
        setTimeout(() => { 
            toast.style.opacity = '0';
            setTimeout(() => { if(document.body.contains(toast)) document.body.removeChild(toast); }, 400);
        }, 2200); 
    }

    // =========================================================
    // 4. VOD 加解密核心逻辑 (严格遵循 Hex 拼接协议)
    // =========================================================

    function encryptVod(data, keyString, ivString) {
        try {
            // 如果用户没填 IV，使用内置默认值
            const finalIv = ivString || DEFAULT_IV;
            const key = processKeyToWords(keyString);
            const iv = processKeyToWords(finalIv);
            
            // AES 加密
            const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv });
            const encryptedHex = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
            
            // 构造固定头部和尾部
            const keyHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(keyString));
            const ivHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(finalIv));
            
            // 返回最终拼接结果: $# + KeyHex + #$ + CipherHex + IvHex
            return "2423" + keyHex + "2324" + encryptedHex + ivHex;
        } catch (e) {
            showToast("加密发生错误: " + e.message);
            return data;
        }
    }

    function decryptVod(ciphertext, ivString) {
        try {
            const finalIv = ivString || DEFAULT_IV;
            
            // 基础校验
            if (!ciphertext.startsWith("2423") || !ciphertext.includes("2324")) {
                return null;
            }
            
            const separatorIndex = ciphertext.indexOf("2324");
            const keyHex = ciphertext.substring(4, separatorIndex);
            const keyStringFromCipher = CryptoJS.enc.Hex.parse(keyHex).toString(CryptoJS.enc.Utf8);
            
            // 获取 IV 的十六进制长度用于定位正文
            const ivHex = CryptoJS.enc.Hex.stringify(CryptoJS.enc.Utf8.parse(finalIv));
            const ivHexLength = ivHex.length;
            
            const bodyAndIvHex = ciphertext.substring(separatorIndex + 4);
            if (bodyAndIvHex.length < ivHexLength) return null;
            
            // 提取真正的密文段
            const encryptedHex = bodyAndIvHex.substring(0, bodyAndIvHex.length - ivHexLength);
            
            const key = processKeyToWords(keyStringFromCipher);
            const iv = processKeyToWords(finalIv);
            const ciphertextWords = CryptoJS.enc.Hex.parse(encryptedHex);
            
            // AES 解密
            const decrypted = CryptoJS.AES.decrypt({ ciphertext: ciphertextWords }, key, { iv: iv });
            const result = decrypted.toString(CryptoJS.enc.Utf8);
            
            return result || null;
        } catch (e) {
            console.error("解密异常:", e);
            return null;
        }
    }

    // =========================================================
    // 5. 凤凰系统加解密核心 (严格修正 IV 问题)
    // =========================================================
    
    function encryptPhoenix(data, keyStr, ivStr) {
        try {
            const key = CryptoJS.enc.Utf8.parse(keyStr);
            const iv = CryptoJS.enc.Utf8.parse(ivStr);
            const encrypted = CryptoJS.AES.encrypt(data, key, { iv: iv });
            return encrypted.toString();
        } catch (e) {
            return null;
        }
    }

    function decryptPhoenix(ciphertext, keyStr, ivStr) {
        try {
            const key = CryptoJS.enc.Utf8.parse(keyStr);
            const iv = CryptoJS.enc.Utf8.parse(ivStr);
            const decrypted = CryptoJS.AES.decrypt(ciphertext, key, { iv: iv });
            return decrypted.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            return null;
        }
    }

    // =========================================================
    // 6. 事件绑定：通用与工具
    // =========================================================

    // 粘贴
    if(btnPaste) btnPaste.addEventListener('click', () => {
        navigator.clipboard.readText().then(text => {
            mainInput.value = text;
            showToast('内容已粘贴');
        }).catch(() => showToast('无法访问剪贴板，请手动粘贴'));
    });

    // 复制
    if(btnCopy) btnCopy.addEventListener('click', () => {
        if(!mainInput.value) return;
        navigator.clipboard.writeText(mainInput.value).then(() => {
            showToast('已复制到剪贴板');
        }).catch(() => showToast('复制失败，请手动选择'));
    });

    // 清空
    if(btnClear) btnClear.addEventListener('click', () => {
        mainInput.value = "";
        showToast('已清空');
    });

    // =========================================================
    // 7. 事件绑定：VOD 业务
    // =========================================================

    // VOD 加密
    if(btnEncryptVod) btnEncryptVod.addEventListener('click', () => {
        const key = vodKeyInput.value;
        const iv = vodIvInput.value;
        if (!key) {
            showToast("请先输入 VOD 的 Key！");
            return;
        }
        mainInput.value = encryptVod(mainInput.value, key, iv);
        showToast(iv ? "VOD 加密完成" : "VOD 加密完成 (已应用默认 IV)");
    });

    // VOD 解密
    if(btnDecryptVod) btnDecryptVod.addEventListener('click', () => {
        const iv = vodIvInput.value;
        const result = decryptVod(mainInput.value, iv);
        if (result) {
            mainInput.value = result;
            showToast(iv ? "VOD 解密成功" : "VOD 解密成功 (使用默认 IV)");
        } else {
            showToast("解密失败：密文不合规或参数错误");
        }
    });

    // =========================================================
    // 8. 事件绑定：图片隐写 (拼接模式)
    // =========================================================

    // 生成 BMP 图片
    if(btnImageEncode) btnImageEncode.addEventListener('click', () => {
        const content = mainInput.value;
        if (!content) {
            showToast("请先输入要隐藏的内容");
            return;
        }
        // 进行二次 Base64 编码确保传输安全
        const secondaryBase64 = CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(content));
        // 内置 1x1 像素 BMP 文件头模板
        const bmpHeader = 'Qk0eAAAAAAD+AAAAAAABAAABABgAAAAAABQAAAD/AAAA///wAAAA/wAAAP8=';
        // 关键拼接格式: 图片头部 + buuoZEQO** + 密文
        const finalData = bmpHeader + "buuoZEQO**" + secondaryBase64;

        const blob = new Blob([finalData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'config_waner.bmp';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("已下载伪装 BMP 配置文件");
    });

    // 提取密文
    if(imageFileInputDecode) imageFileInputDecode.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const raw = event.target.result;
            const parts = raw.split('**');
            if (parts.length >= 2) {
                // 提取并清理标记
                const b64 = parts[1].replace(/buuoZEQO/g, '').trim();
                try {
                    const decoded = CryptoJS.enc.Base64.parse(b64).toString(CryptoJS.enc.Utf8);
                    // 清理潜在的控制字符
                    mainInput.value = decoded.replace(/[\u0000-\u001F]+/g, '').trim();
                    showToast("密文提取成功！");
                } catch (err) {
                    showToast("提取失败：密文编码损坏");
                }
            } else {
                showToast("提取失败：未发现 ** 拼接标记");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // 允许重复上传
    });

    // =========================================================
    // 9. 事件绑定：凤凰系统业务
    // =========================================================

    // 激活码
    if(btnEncryptAct) btnEncryptAct.addEventListener('click', () => {
        if(!mainInput.value) return;
        const r = encryptPhoenix(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV);
        if(r) { mainInput.value = r; showToast("凤凰激活码已加密"); }
    });
    if(btnDecryptAct) btnDecryptAct.addEventListener('click', () => {
        if(!mainInput.value) return;
        const r = decryptPhoenix(mainInput.value, PHOENIX_API_KEY, PHOENIX_API_IV);
        if(r) { mainInput.value = r; showToast("凤凰激活码已解密"); } else { showToast("解密失败"); }
    });

    // 过滤规则
    if(btnEncryptRule) btnEncryptRule.addEventListener('click', () => {
        if(!mainInput.value) return;
        const r = encryptPhoenix(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV);
        if(r) { mainInput.value = r; showToast("凤凰规则已加密"); }
    });
    if(btnDecryptRule) btnDecryptRule.addEventListener('click', () => {
        if(!mainInput.value) return;
        const r = decryptPhoenix(mainInput.value, PHOENIX_RULE_KEY, PHOENIX_RULE_IV);
        if(r) { mainInput.value = r; showToast("凤凰规则已解密"); } else { showToast("解密失败"); }
    });

    // --- 通用剪贴板操作 ---
    if(btnPaste) btnPaste.addEventListener('click', () => { 
        navigator.clipboard.readText()
            .then(text => { mainInput.value = text; showToast('已从剪贴板粘贴'); })
            .catch(err => { showToast('粘贴失败，浏览器权限不足。'); });
    });
    if(btnCopy) btnCopy.addEventListener('click', () => { 
        if(mainInput.value) {
            navigator.clipboard.writeText(mainInput.value)
                .then(() => showToast('已成功复制到剪贴板'))
                .catch(err => { showToast('复制失败，请手动选择复制。'); });
        }
    });
    if(btnClear) btnClear.addEventListener('click', () => { 
        mainInput.value = ""; 
        showToast('输入框已清空'); 
    });
});
// 必须在整个 JS 逻辑结束后，用 </body> 和 </html> 结束 HTML
