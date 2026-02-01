// 修复链接格式的脚本
import { linkService } from './services/linkService.js';

async function fixLinkFormat() {
  console.log('=== 修复链接格式 ===');
  
  try {
    // 清除旧的错误链接数据
    localStorage.removeItem('complexLinks');
    localStorage.removeItem('projectLinks');
    localStorage.removeItem('linkUsage');
    localStorage.removeItem('linkActive');
    localStorage.removeItem('projectCurrentIndex');
    
    console.log('✅ 已清除旧的链接数据');
    
    // 为测试项目重新生成正确格式的链接
    const testProjectId = 'proj_1';
    const links = linkService.generateLinksForProject(testProjectId);
    
    console.log(`✅ 为项目 ${testProjectId} 重新生成了 ${links.length} 个链接`);
    console.log('示例链接:');
    links.slice(0, 2).forEach((link, index) => {
      console.log(`${index + 1}. ${link}`);
    });
    
    // 测试获取下一个链接
    const nextLink = linkService.getNextLinkForProject(testProjectId);
    console.log('\n获取的下一个链接:');
    console.log(nextLink);
    
    // 验证链接格式
    const hasHashPrefix = nextLink.includes('#/entry/');
    const hasDoubleSlash = nextLink.includes('//entry');
    
    console.log('\n链接格式验证:');
    console.log(`包含 #/entry/: ${hasHashPrefix}`);
    console.log(`包含双斜杠 //entry: ${hasDoubleSlash}`);
    
    if (hasHashPrefix && !hasDoubleSlash) {
      console.log('\n✅ 链接格式正确！');
    } else {
      console.log('\n❌ 链接格式仍有问题');
    }
    
  } catch (error) {
    console.error('修复失败:', error);
  }
}

// 运行修复
fixLinkFormat();
