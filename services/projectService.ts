import { ProductProject, ProjectStatus, AIProvider, KnowledgeType } from '../types';

// 项目数据服务 - 模拟服务端数据库
class ProjectService {
  private static instance: ProjectService;
  private projects: Map<string, ProductProject> = new Map();

  private constructor() {
    this.initializeDefaultProjects();
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  // 初始化默认项目数据（模拟服务端预置数据）
  private initializeDefaultProjects() {
    const defaultProjects: ProductProject[] = [
      {
        id: 'p1',
        name: '测试项目',
        description: '用于测试扫码功能的项目。',
        status: ProjectStatus.ACTIVE,
        config: {
          provider: AIProvider.ZHIPU,
          voiceName: 'tongtong',
          visionEnabled: true,
          visionPrompt: 'Check if all cables are plugged in and the LED is glowing green.',
          systemInstruction: 'You are a helpful product assistant.',
          videoGuides: [],
          multimodalEnabled: true,
          videoChatEnabled: true,
          videoChatPrompt: '您是中恒创世科技的专业技术支持专家。请仔细分析用户提供的视频内容，识别产品使用或安装过程中的具体问题，并基于产品知识库提供准确的解决方案。\n\n分析重点：\n1. 产品型号识别与规格确认\n2. 安装步骤的正确性检查\n3. 连接线路与接口状态\n4. 设备指示灯与显示状态\n5. 操作流程的规范性\n6. 潜在安全隐患识别\n\n回复要求：\n- 使用专业但易懂的语言\n- 提供具体的操作步骤\n- 标注重要的安全注意事项\n- 如需更换配件，请说明具体型号\n- 优先引用官方知识库内容\n- 必要时建议联系中恒创世技术支持热线',
          avatarEnabled: true,
          annotationEnabled: true
        },
        knowledgeBase: [
          { 
            id: 'k1', 
            title: '使用说明', 
            type: KnowledgeType.TEXT, 
            content: '这是一个测试项目，用于验证扫码功能是否正常工作。', 
            createdAt: new Date().toISOString() 
          },
          { 
            id: 'k2', 
            title: '测试内容', 
            type: KnowledgeType.TEXT, 
            content: '扫码成功！您可以开始使用AI虚拟客服功能了。', 
            createdAt: new Date().toISOString() 
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'proj_1',
        name: 'SmartHome Pro Hub',
        description: 'Next-gen automation controller for modern homes. 下一代智能家居控制器。',
        status: ProjectStatus.ACTIVE,
        config: {
          provider: AIProvider.ZHIPU,
          voiceName: 'tongtong',
          visionEnabled: true,
          visionPrompt: 'Check if all cables are plugged in and the LED is glowing green.',
          systemInstruction: 'You are a technical support expert for SmartHome Pro products.',
          videoGuides: [],
          multimodalEnabled: true,
          videoChatEnabled: true,
          videoChatPrompt: '您是中恒创世科技SmartHome Pro系列产品的专业技术支持专家。请仔细分析用户提供的视频内容，识别智能家居设备使用或安装过程中的具体问题，并基于产品知识库提供准确的解决方案。\n\n分析重点：\n1. 设备型号识别与兼容性确认\n2. 网络连接状态与信号强度\n3. 安装位置与环境适配性\n4. 设备配对与同步状态\n5. 操作界面与功能设置\n6. 电源供应与线路安全\n\n回复要求：\n- 使用专业但易懂的语言\n- 提供具体的操作步骤\n- 标注重要的安全注意事项\n- 如需更换配件，请说明具体型号\n- 优先引用官方知识库内容\n- 必要时建议联系中恒创世技术支持热线',
          avatarEnabled: true,
          annotationEnabled: true
        },
        knowledgeBase: [
          { 
            id: 'k1', 
            title: 'Initial Setup', 
            type: KnowledgeType.TEXT, 
            content: 'Plug in the device and wait 60 seconds.', 
            createdAt: new Date().toISOString() 
          },
          { 
            id: 'k2', 
            title: 'Connection Guide', 
            type: KnowledgeType.TEXT, 
            content: '1. Download the SmartHome app\n2. Create an account\n3. Follow the in-app setup instructions', 
            createdAt: new Date().toISOString() 
          },
          { 
            id: 'k3', 
            title: 'Troubleshooting', 
            type: KnowledgeType.TEXT, 
            content: 'If the device is not responding, try resetting it by pressing and holding the reset button for 10 seconds.', 
            createdAt: new Date().toISOString() 
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'proj_2',
        name: 'SmartThermostat',
        description: 'Intelligent temperature control system. 智能温度控制系统。',
        status: ProjectStatus.ACTIVE,
        config: {
          provider: AIProvider.ZHIPU,
          voiceName: 'tongtong',
          visionEnabled: false,
          visionPrompt: '',
          systemInstruction: 'You are a helpful assistant for SmartThermostat users.',
          videoGuides: [],
          multimodalEnabled: true,
          videoChatEnabled: true,
          videoChatPrompt: '您是中恒创世科技SmartThermostat智能温控系统的专业技术支持专家。请仔细分析用户提供的视频内容，识别温控设备使用或安装过程中的具体问题，并基于产品知识库提供准确的解决方案。\n\n分析重点：\n1. 温控器安装位置与环境条件\n2. 线路连接与电气安全\n3. 温度传感器工作状态\n4. 系统设置与程序配置\n5. 显示屏状态与用户界面\n6. 节能模式与时间设定\n\n回复要求：\n- 使用专业但易懂的语言\n- 提供具体的操作步骤\n- 特别注意电气安全提醒\n- 如需调整参数，请说明具体数值\n- 优先引用官方知识库内容\n- 必要时建议联系中恒创世技术支持热线',
          avatarEnabled: true,
          annotationEnabled: true
        },
        knowledgeBase: [
          { 
            id: 'k1', 
            title: 'Installation', 
            type: KnowledgeType.TEXT, 
            content: 'Mount the thermostat on the wall and connect the wires according to the diagram.', 
            createdAt: new Date().toISOString() 
          },
          { 
            id: 'k2', 
            title: 'Usage Tips', 
            type: KnowledgeType.TEXT, 
            content: 'Set different temperatures for day and night to save energy.', 
            createdAt: new Date().toISOString() 
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    // 将默认项目添加到内存数据库
    defaultProjects.forEach(project => {
      this.projects.set(project.id, project);
    });

    // 同时从localStorage加载商家创建的项目
    this.loadProjectsFromLocalStorage();
    
    // 为默认项目生成扫码链接（如果还没有的话）
    this.initializeProjectLinks();
  }

  // 为项目初始化扫码链接
  private initializeProjectLinks() {
    // 导入linkService并为每个项目生成链接
    import('../services/linkService').then(({ linkService }) => {
      this.projects.forEach((project, projectId) => {
        // 检查项目是否已有链接
        const existingLinks = linkService.getAllLinksForProject(projectId);
        if (existingLinks.length === 0) {
          // 为项目生成100个扫码链接
          console.log(`为项目 ${project.name} (${projectId}) 生成扫码链接...`);
          linkService.generateLinksForProject(projectId);
        }
      });
    }).catch(error => {
      console.error('Failed to initialize project links:', error);
    });
  }

  // 从localStorage加载商家创建的项目
  private loadProjectsFromLocalStorage() {
    try {
      const saved = localStorage.getItem('smartguide_projects');
      if (saved) {
        const parsed = JSON.parse(saved) as ProductProject[];
        parsed.forEach(project => {
          // 确保项目配置完整
          const completeProject = {
            ...project,
            config: {
              provider: AIProvider.ZHIPU,
              videoGuides: [],
              ...project.config
            },
            knowledgeBase: project.knowledgeBase || []
          };
          this.projects.set(project.id, completeProject);
        });
      }
    } catch (error) {
      console.error('Failed to load projects from localStorage:', error);
    }
  }

  // 根据projectId获取项目（用户扫码时调用）
  public async getProjectById(projectId: string): Promise<ProductProject | null> {
    // 模拟异步数据库查询
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = this.projects.get(projectId);
        resolve(project || null);
      }, 100);
    });
  }

  // 获取所有项目（商家后台使用）
  public async getAllProjects(): Promise<ProductProject[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(Array.from(this.projects.values()));
      }, 100);
    });
  }

  // 创建新项目（商家后台使用）
  public async createProject(project: ProductProject): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.projects.set(project.id, project);
        this.syncToLocalStorage();
        resolve(true);
      }, 100);
    });
  }

  // 更新项目（商家后台使用）
  public async updateProject(project: ProductProject): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.projects.has(project.id)) {
          this.projects.set(project.id, project);
          this.syncToLocalStorage();
          resolve(true);
        } else {
          resolve(false);
        }
      }, 100);
    });
  }

  // 删除项目（商家后台使用）
  public async deleteProject(projectId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const deleted = this.projects.delete(projectId);
        if (deleted) {
          this.syncToLocalStorage();
        }
        resolve(deleted);
      }, 100);
    });
  }

  // 验证项目ID是否有效（二维码验证）
  public async validateProjectId(projectId: string): Promise<{
    valid: boolean;
    project?: ProductProject;
    error?: string;
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const project = this.projects.get(projectId);
        
        if (!project) {
          resolve({
            valid: false,
            error: '项目不存在或已被删除'
          });
          return;
        }

        if (project.status !== ProjectStatus.ACTIVE) {
          resolve({
            valid: false,
            error: '项目已暂停服务'
          });
          return;
        }

        resolve({
          valid: true,
          project: project
        });
      }, 100);
    });
  }

  // 同步到localStorage（商家后台数据持久化）
  private syncToLocalStorage() {
    try {
      const projectsArray = Array.from(this.projects.values());
      localStorage.setItem('smartguide_projects', JSON.stringify(projectsArray));
    } catch (error) {
      console.error('Failed to sync projects to localStorage:', error);
    }
  }

  // 记录用户访问（可选的分析功能）
  public async logUserAccess(projectId: string, userInfo?: {
    timestamp: string;
    userAgent?: string;
    referrer?: string;
  }): Promise<void> {
    // 这里可以实现用户访问日志
    // 注意：只记录必要的匿名统计信息，不记录个人隐私
    console.log(`User accessed project ${projectId} at ${userInfo?.timestamp}`);
  }

  // 获取项目的扫码链接
  public async getProjectQRLinks(projectId: string): Promise<string[]> {
    return new Promise(async (resolve) => {
      try {
        const { linkService } = await import('../services/linkService');
        const links = linkService.getAllLinksForProject(projectId);
        resolve(links);
      } catch (error) {
        console.error('Failed to get project QR links:', error);
        resolve([]);
      }
    });
  }

  // 生成项目的下一个可用扫码链接
  public async getNextQRLink(projectId: string): Promise<string> {
    return new Promise(async (resolve) => {
      try {
        const { linkService } = await import('../services/linkService');
        const link = linkService.getNextLinkForProject(projectId);
        resolve(link);
      } catch (error) {
        console.error('Failed to get next QR link:', error);
        resolve('');
      }
    });
  }
}

// 导出单例实例
export const projectService = ProjectService.getInstance();