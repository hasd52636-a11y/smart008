// 测试脚本：测试QR码链接生成
import { linkService } from './services/linkService.js';

async function testLinkGeneration() {
  console.log('=== 测试QR码链接生成 ===');
  
  try {
    // 为测试项目生成链接
    const testProjectId = 'proj_1';
    
    // 生成链接
    const links = linkService.generateLinksForProject(testProjectId);
    console.log(`生成了 ${links.length} 个链接`);
    
    // 显示前3个链接作为示例
    console.log('示例链接:');
    links.slice(0, 3).forEach((link, index) => {
      console.log(`${index + 1}. ${link}`);
    });
    
    // 测试获取下一个链接
    const nextLink = linkService.getNextLinkForProject(testProjectId);
    console.log('\n获取的下一个链接:');
    console.log(nextLink);
    
    // 测试从链接中提取shortCode
    const shortCodeMatch = nextLink.match(/\/entry\/([^?]+)/);
    if (shortCodeMatch) {
      const shortCode = shortCodeMatch[1];
      console.log('\n提取的shortCode:');
      console.log(shortCode);
      
      // 测试通过shortCode获取项目ID
      const projectId = linkService.getProjectIdByShortCode(shortCode);
      console.log('\n通过shortCode获取的项目ID:');
      console.log(projectId);
      
      if (projectId === testProjectId) {
        console.log('\n✅ 测试成功：shortCode正确映射到项目ID');
      } else {
        console.log('\n❌ 测试失败：shortCode映射到错误的项目ID');
      }
    } else {
      console.log('\n❌ 测试失败：无法从链接中提取shortCode');
    }
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

// 运行测试
testLinkGeneration();
