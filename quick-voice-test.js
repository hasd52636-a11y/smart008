// 快速语音测试脚本
// 在浏览器控制台中运行此脚本来测试语音功能

console.log('🎵 开始快速语音测试...');

// 从localStorage获取API密钥
const apiKey = localStorage.getItem('zhipuApiKey');
if (!apiKey) {
    console.error('❌ 未找到API密钥，请先在设置页面配置');
} else {
    console.log('✅ 已找到API密钥');
}

// 测试单个语音的函数
async function testVoice(voiceName, testText = '你好，这是语音测试') {
    console.log(`🧪 测试语音: ${voiceName}`);
    
    try {
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/audio/speech', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'glm-tts',
                input: testText,
                voice: voiceName,
                response_format: 'wav'
            }),
        });
        
        if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            console.log(`✅ ${voiceName}: 成功 (${arrayBuffer.byteLength} 字节)`);
            
            // 可选：播放音频
            const uint8Array = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < uint8Array.byteLength; i++) {
                binary += String.fromCharCode(uint8Array[i]);
            }
            const base64Audio = btoa(binary);
            const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
            audio.play().catch(err => console.log(`播放失败: ${err.message}`));
            
            return { success: true, size: arrayBuffer.byteLength };
        } else {
            const errorText = await response.text();
            let errorData;
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { error: { message: errorText } };
            }
            
            console.log(`❌ ${voiceName}: 失败 - ${response.status} ${errorData.error?.message || errorText}`);
            return { success: false, error: `${response.status}: ${errorData.error?.message || errorText}` };
        }
    } catch (error) {
        console.log(`❌ ${voiceName}: 网络错误 - ${error.message}`);
        return { success: false, error: error.message };
    }
}

// 测试所有支持的语音
async function testAllVoices() {
    const voices = ['tongtong', 'chuichui', 'xiaochen', 'jam', 'kazi', 'douji', 'luodo'];
    const results = {};
    
    console.log('🚀 开始批量测试...');
    
    for (const voice of voices) {
        results[voice] = await testVoice(voice);
        // 添加延迟避免API限流
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 生成报告
    console.log('\n📊 测试报告:');
    console.log('='.repeat(50));
    
    const successful = Object.entries(results).filter(([_, result]) => result.success);
    const failed = Object.entries(results).filter(([_, result]) => !result.success);
    
    console.log(`✅ 成功: ${successful.length}/${voices.length}`);
    successful.forEach(([voice, result]) => {
        console.log(`  ✅ ${voice} (${result.size} 字节)`);
    });
    
    console.log(`❌ 失败: ${failed.length}/${voices.length}`);
    failed.forEach(([voice, result]) => {
        console.log(`  ❌ ${voice}: ${result.error}`);
    });
    
    // 分析失败原因
    if (failed.length > 0) {
        console.log('\n🔍 失败原因分析:');
        const errorTypes = {};
        failed.forEach(([voice, result]) => {
            let category;
            if (result.error.includes('401')) {
                category = '🔑 认证失败';
            } else if (result.error.includes('403')) {
                category = '🚫 权限不足';
            } else if (result.error.includes('404')) {
                category = '❓ 语音不存在';
            } else if (result.error.includes('429')) {
                category = '⏰ 请求过频';
            } else {
                category = '❓ 其他错误';
            }
            
            if (!errorTypes[category]) errorTypes[category] = [];
            errorTypes[category].push(voice);
        });
        
        Object.entries(errorTypes).forEach(([category, voices]) => {
            console.log(`  ${category}: ${voices.join(', ')}`);
        });
    }
    
    return results;
}

// 推荐的使用策略
function showRecommendations(results) {
    console.log('\n💡 使用建议:');
    console.log('='.repeat(50));
    
    if (results.tongtong?.success) {
        console.log('✅ 推荐使用 tongtong (默认语音，最稳定)');
    } else {
        console.log('⚠️  连 tongtong 都失败了，请检查API密钥');
    }
    
    const workingVoices = Object.entries(results)
        .filter(([_, result]) => result.success)
        .map(([voice, _]) => voice);
    
    if (workingVoices.length > 1) {
        console.log(`✅ 可用的语音: ${workingVoices.join(', ')}`);
    }
    
    const failedVoices = Object.entries(results)
        .filter(([_, result]) => !result.success)
        .map(([voice, _]) => voice);
    
    if (failedVoices.length > 0) {
        console.log(`❌ 不可用的语音: ${failedVoices.join(', ')}`);
        console.log('💰 这些语音可能需要付费账户或特殊权限');
    }
}

// 如果有API密钥，自动开始测试
if (apiKey) {
    testAllVoices().then(results => {
        showRecommendations(results);
        console.log('\n🎯 测试完成！');
        console.log('如需详细诊断，请使用 voice-test-diagnostic.html 工具');
    });
} else {
    console.log('请先配置API密钥，然后运行: testAllVoices()');
}

// 导出函数供手动调用
window.testVoice = testVoice;
window.testAllVoices = testAllVoices;