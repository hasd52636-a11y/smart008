import { ProductProject } from '../types';

// 链接服务类，用于管理100个复杂长链接的生成和循环使用
export class LinkService {
  private static instance: LinkService;
  private complexLinks: Map<string, string> = new Map(); // 链接映射: shortCode -> fullLink
  private projectLinks: Map<string, string[]> = new Map(); // 项目映射: projectId -> [shortCode1, shortCode2, ...]
  private linkUsage: Map<string, number> = new Map(); // 链接使用计数
  private maxLinksPerProject = 100;
  private currentIndex = 0;

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
  }

  private saveToStorage() {
    try {
      localStorage.setItem('complexLinks', JSON.stringify(Object.fromEntries(this.complexLinks)));
      localStorage.setItem('projectLinks', JSON.stringify(Object.fromEntries(this.projectLinks)));
      localStorage.setItem('linkUsage', JSON.stringify(Object.fromEntries(this.linkUsage)));
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

  // 为项目生成100个复杂长链接
  generateLinksForProject(projectId: string): string[] {
    const links: string[] = [];
    const shortCodes: string[] = [];

    for (let i = 0; i < this.maxLinksPerProject; i++) {
      const shortCode = this.generateComplexString(8);
      const complexPart = this.generateComplexString(64);
      const timestamp = Date.now() + i * 1000;
      const randomParams = `r=${Math.random().toString(36).substr(2, 9)}&t=${timestamp}`;
      
      const fullLink = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}${window.location.pathname}#/entry/${shortCode}?${randomParams}&data=${complexPart}`;
      
      this.complexLinks.set(shortCode, fullLink);
      shortCodes.push(shortCode);
      links.push(fullLink);
      this.linkUsage.set(shortCode, 0);
    }

    this.projectLinks.set(projectId, shortCodes);
    this.saveToStorage();
    return links;
  }

  // 获取项目的下一个可用链接（循环使用）
  getNextLinkForProject(projectId: string): string {
    let shortCodes = this.projectLinks.get(projectId);
    
    // 如果项目还没有生成链接，生成100个
    if (!shortCodes || shortCodes.length === 0) {
      shortCodes = this.generateLinksForProject(projectId).map(link => {
        const match = link.match(/\/entry\/(\w+)/);
        return match ? match[1] : '';
      }).filter(Boolean);
    }

    // 循环获取下一个链接
    const currentIndex = this.currentIndex % shortCodes.length;
    const shortCode = shortCodes[currentIndex];
    this.currentIndex++;

    // 增加使用计数
    const currentUsage = this.linkUsage.get(shortCode) || 0;
    this.linkUsage.set(shortCode, currentUsage + 1);
    this.saveToStorage();

    return this.complexLinks.get(shortCode) || '';
  }

  // 获取项目的所有链接
  getAllLinksForProject(projectId: string): string[] {
    const shortCodes = this.projectLinks.get(projectId) || [];
    return shortCodes.map(code => this.complexLinks.get(code) || '').filter(Boolean);
  }

  // 根据shortCode获取对应的项目ID
  getProjectIdByShortCode(shortCode: string): string | null {
    for (const [projectId, shortCodes] of this.projectLinks.entries()) {
      if (shortCodes.includes(shortCode)) {
        return projectId;
      }
    }
    return null;
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
