import { ProductProject } from '../types';

// 链接服务类，用于管理20个复杂长链接的生成和循环使用
export class LinkService {
  private static instance: LinkService;
  private complexLinks: Map<string, string> = new Map(); // 链接映射: shortCode -> fullLink
  private projectLinks: Map<string, string[]> = new Map(); // 项目映射: projectId -> [shortCode1, shortCode2, ...]
  private linkUsage: Map<string, number> = new Map(); // 链接使用计数
  private linkActive: Map<string, boolean> = new Map(); // 链接活跃状态: shortCode -> isActive
  private projectCurrentIndex: Map<string, number> = new Map(); // 每个项目的当前索引
  private maxLinksPerProject = 20;
  private maxActiveLinks = 10;

  private constructor() {
    this.initialize();
  }

  public static getInstance(): LinkService {
    if (!LinkService.instance) {
      LinkService.instance = new LinkService();
    }
    return LinkService.instance;
  }

  private initialize() {
    // 从localStorage加载保存的链接数据
    const savedLinks = localStorage.getItem('complexLinks');
    const savedProjectLinks = localStorage.getItem('projectLinks');
    const savedLinkUsage = localStorage.getItem('linkUsage');
    const savedLinkActive = localStorage.getItem('linkActive');
    const savedProjectCurrentIndex = localStorage.getItem('projectCurrentIndex');

    if (savedLinks) {
      try {
        const parsed = JSON.parse(savedLinks);
        this.complexLinks = new Map(Object.entries(parsed));
      } catch (error) {
        console.error('Error loading complex links:', error);
      }
    }

    if (savedProjectLinks) {
      try {
        const parsed = JSON.parse(savedProjectLinks);
        this.projectLinks = new Map(Object.entries(parsed));
      } catch (error) {
        console.error('Error loading project links:', error);
      }
    }

    if (savedLinkUsage) {
      try {
        const parsed = JSON.parse(savedLinkUsage);
        this.linkUsage = new Map(Object.entries(parsed));
      } catch (error) {
        console.error('Error loading link usage:', error);
      }
    }

    if (savedLinkActive) {
      try {
        const parsed = JSON.parse(savedLinkActive);
        this.linkActive = new Map(Object.entries(parsed));
      } catch (error) {
        console.error('Error loading link active status:', error);
      }
    }

    if (savedProjectCurrentIndex) {
      try {
        const parsed = JSON.parse(savedProjectCurrentIndex);
        this.projectCurrentIndex = new Map(Object.entries(parsed).map(([key, value]) => [key, Number(value)]));
      } catch (error) {
        console.error('Error loading project current index:', error);
      }
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('complexLinks', JSON.stringify(Object.fromEntries(this.complexLinks)));
      localStorage.setItem('projectLinks', JSON.stringify(Object.fromEntries(this.projectLinks)));
      localStorage.setItem('linkUsage', JSON.stringify(Object.fromEntries(this.linkUsage)));
      localStorage.setItem('linkActive', JSON.stringify(Object.fromEntries(this.linkActive)));
      localStorage.setItem('projectCurrentIndex', JSON.stringify(Object.fromEntries(this.projectCurrentIndex)));
    } catch (error) {
      console.error('Error saving links to storage:', error);
    }
  }

  // 生成复杂的随机字符串
  private generateComplexString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // 为项目生成20个复杂长链接
  generateLinksForProject(projectId: string): string[] {
    const links: string[] = [];
    const shortCodes: string[] = [];

    for (let i = 0; i < this.maxLinksPerProject; i++) {
      const shortCode = this.generateComplexString(12); // 更长的 shortCode
      const complexPart = this.generateComplexString(96); // 更复杂的随机部分
      const projectKey = this.generateComplexString(32); // 项目特定的密钥
      const sequenceId = i.toString().padStart(3, '0'); // 序列ID，确保顺序
      
      // 生成固定长度的复杂链接，包含项目信息和序列ID
      const baseUrl = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
      // 对于HashRouter，需要包含#/前缀
      const fullLink = `${baseUrl}/#/entry/${shortCode}?seq=${sequenceId}&proj=${projectKey}&data=${complexPart}`;
      
      this.complexLinks.set(shortCode, fullLink);
      shortCodes.push(shortCode);
      links.push(fullLink);
      this.linkUsage.set(shortCode, 0);
      this.linkActive.set(shortCode, false); // 初始状态为非活跃
    }

    this.projectLinks.set(projectId, shortCodes);
    this.projectCurrentIndex.set(projectId, 0); // 初始化项目的当前索引
    this.saveToStorage();
    return links;
  }

  // 获取项目的下一个可用链接（循环使用）
  getNextLinkForProject(projectId: string): string {
    let shortCodes = this.projectLinks.get(projectId);
    
    // 如果项目还没有生成链接，生成20个
    if (!shortCodes || shortCodes.length === 0) {
      shortCodes = this.generateLinksForProject(projectId).map(link => {
        // 匹配包含#和?的链接格式
        const match = link.match(/\/entry\/([^?]+)/);
        return match ? match[1] : '';
      }).filter(Boolean);
    }

    // 获取项目当前索引
    let currentIndex = this.projectCurrentIndex.get(projectId) || 0;
    let attempts = 0;
    let selectedShortCode = '';

    // 寻找下一个可用链接，最多尝试20次
    while (attempts < shortCodes.length) {
      const shortCode = shortCodes[currentIndex];
      const isActive = this.linkActive.get(shortCode) || false;
      
      // 检查是否可以使用此链接
      if (!isActive || this.getActiveLinksCount() < this.maxActiveLinks) {
        selectedShortCode = shortCode;
        // 标记链接为活跃状态
        this.linkActive.set(shortCode, true);
        break;
      }
      
      // 移动到下一个链接
      currentIndex = (currentIndex + 1) % shortCodes.length;
      attempts++;
    }

    // 如果没有找到可用链接（理论上不应该发生），使用第一个链接
    if (!selectedShortCode && shortCodes.length > 0) {
      selectedShortCode = shortCodes[0];
      this.linkActive.set(selectedShortCode, true);
    }

    // 更新项目当前索引
    this.projectCurrentIndex.set(projectId, (currentIndex + 1) % shortCodes.length);

    // 增加使用计数
    if (selectedShortCode) {
      const currentUsage = this.linkUsage.get(selectedShortCode) || 0;
      this.linkUsage.set(selectedShortCode, currentUsage + 1);
      this.saveToStorage();
    }

    return this.complexLinks.get(selectedShortCode) || '';
  }

  // 获取项目的所有链接
  getAllLinksForProject(projectId: string): string[] {
    const shortCodes = this.projectLinks.get(projectId) || [];
    return shortCodes.map(code => this.complexLinks.get(code) || '').filter(Boolean);
  }

  // 根据shortCode获取对应的项目ID
  getProjectIdByShortCode(shortCode: string): string | null {
    console.log('=== linkService.getProjectIdByShortCode ===');
    console.log('shortCode:', shortCode);
    console.log('projectLinks:', Object.fromEntries(this.projectLinks));
    
    for (const [projectId, shortCodes] of this.projectLinks.entries()) {
      console.log('检查项目:', projectId, 'shortCodes:', shortCodes);
      if (shortCodes.includes(shortCode)) {
        console.log('找到匹配的项目ID:', projectId);
        return projectId;
      }
    }
    
    console.log('未找到匹配的项目ID');
    return null;
  }

  // 计算当前活跃的链接数量
  getActiveLinksCount(): number {
    let count = 0;
    for (const isActive of this.linkActive.values()) {
      if (isActive) {
        count++;
      }
    }
    return count;
  }

  // 重置所有链接的使用计数
  resetLinkUsage() {
    for (const shortCode of this.complexLinks.keys()) {
      this.linkUsage.set(shortCode, 0);
    }
    this.saveToStorage();
  }

  // 获取链接使用统计
  getLinkUsageStats(): { total: number; byProject: Map<string, number> } {
    let total = 0;
    const byProject = new Map<string, number>();

    for (const [shortCode, usage] of this.linkUsage.entries()) {
      total += usage;
      const projectId = this.getProjectIdByShortCode(shortCode);
      if (projectId) {
        const current = byProject.get(projectId) || 0;
        byProject.set(projectId, current + usage);
      }
    }

    return { total, byProject };
  }

  // 标记链接为非活跃状态
  deactivateLink(shortCode: string): void {
    this.linkActive.set(shortCode, false);
    this.saveToStorage();
  }

  // 清理过期链接
  cleanupExpiredLinks() {
    const now = Date.now();
    const expiredShortCodes: string[] = [];

    for (const [shortCode, link] of this.complexLinks.entries()) {
      // 检查链接是否包含过期时间戳
      const match = link.match(/&t=(\d+)/);
      if (match) {
        const timestamp = parseInt(match[1]);
        // 如果链接超过30天未使用，标记为过期
        if (now - timestamp > 30 * 24 * 60 * 60 * 1000) {
          expiredShortCodes.push(shortCode);
        }
      }
    }

    // 删除过期链接
    for (const shortCode of expiredShortCodes) {
      this.complexLinks.delete(shortCode);
      this.linkUsage.delete(shortCode);
      this.linkActive.delete(shortCode);
      
      // 从项目链接中移除
      for (const [projectId, shortCodes] of this.projectLinks.entries()) {
        const updatedShortCodes = shortCodes.filter(code => code !== shortCode);
        if (updatedShortCodes.length !== shortCodes.length) {
          this.projectLinks.set(projectId, updatedShortCodes);
        }
      }
    }

    this.saveToStorage();
  }
}

// 导出单例实例
export const linkService = LinkService.getInstance();
