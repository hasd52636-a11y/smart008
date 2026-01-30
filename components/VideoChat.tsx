import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ProductProject, AIProvider } from '../types';
import { 
  Mic, Video, Camera, Volume2, X, Sparkles, Globe, 
  Send, Pencil, Circle, ArrowRight, Highlighter, 
  PlayCircle, ChevronRight, Upload, Image as ImageIcon, 
  FileText, AlertCircle, CheckCircle, Loader2
} from 'lucide-react';
import { aiService, RealtimeCallback, Annotation } from '../services/aiService';
import { projectService } from '../services/projectService';

const VideoChat: React.FC<{ projects?: ProductProject[] }> = ({ projects }) => {
  const { projectId } = useParams();
  const [project, setProject] = useState<ProductProject | null>(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState<string>('');

  // 从服务端加载项目数据
  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) {
        setProjectError('无效的项目ID');
        setProjectLoading(false);
        return;
      }

      try {
        setProjectLoading(true);
        const validation = await projectService.validateProjectId(projectId);
        
        if (!validation.valid) {
          setProjectError(validation.error || '项目验证失败');
          setProjectLoading(false);
          return;
        }

        setProject(validation.project!);
        
        // 记录用户访问
        await projectService.logUserAccess(projectId, {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          referrer: document.referrer
        });
        
        setProjectLoading(false);
      } catch (error) {
        console.error('Failed to load project:', error);
        setProjectError('加载项目信息失败，请稍后重试');
        setProjectLoading(false);
      }
    };

    loadProject();
  }, [projectId]);
  
  // 视频和音频状态
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  
  // 连接状态
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [connectionError, setConnectionError] = useState<string>('');
  
  // 对话状态
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // 虚拟人状态
  const [avatarState, setAvatarState] = useState({
    expression: 'neutral',
    gesture: 'idle',
    speech: '',
    mouthShape: 'closed'
  });
  
  // 标注状态
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentAnnotationType, setCurrentAnnotationType] = useState<'arrow' | 'circle' | 'text' | 'highlight'>('arrow');
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(false);
  
  // OCR 状态
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<string>('');
  const [ocrImage, setOcrImage] = useState<string | null>(null);
  const [ocrMessage, setOcrMessage] = useState({ type: 'info' as 'info' | 'success' | 'error', text: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 引用
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number>();
  
  // 初始化
  useEffect(() => {
    // 加载商家预配置的API密钥
    const savedApiKey = localStorage.getItem('zhipuApiKey');
    if (savedApiKey) {
      aiService.setZhipuApiKey(savedApiKey);
    }
    
    if (project && !projectLoading && !projectError) {
      initializeVideoChat();
    }
    
    return () => {
      cleanup();
    };
  }, [project, projectLoading, projectError]);
  
  // 初始化视频对话
  const initializeVideoChat = async () => {
    try {
      setConnectionStatus('connecting');
      
      // 请求摄像头和麦克风权限
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: true
      });
      
      setVideoStream(stream);
      setAudioStream(stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // 连接到GLM-Realtime
      await connectToRealtime();
      
      // 开始渲染循环
      startRenderLoop();
      
    } catch (error) {
      console.error('Failed to initialize video chat:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          setConnectionError('摄像头或麦克风权限被拒绝，请在浏览器设置中允许访问');
        } else if (error.name === 'NotFoundError') {
          setConnectionError('未找到摄像头或麦克风设备');
        } else if (error.name === 'NotReadableError') {
          setConnectionError('摄像头或麦克风被其他应用占用');
        } else {
          setConnectionError(`设备访问失败: ${error.message}`);
        }
      } else {
        setConnectionError('初始化视频对话失败');
      }
      
      setConnectionStatus('error');
    }
  };
  
  // 连接到GLM-Realtime
  const connectToRealtime = async () => {
    // 检查API密钥
    const savedApiKey = localStorage.getItem('zhipuApiKey');
    if (!savedApiKey) {
      console.error('No API key found');
      setConnectionStatus('error');
      return;
    }
    
    const callback: RealtimeCallback = (data, type) => {
      switch (type) {
        case 'status':
          setConnectionStatus(data.status || 'disconnected');
          setIsConnected(data.status === 'connected');
          break;
        case 'text':
          if (data.type === 'content_part_done') {
            // Handle content part done event
            console.log('Content part completed:', data.part);
          } else if (data.type === 'function_call_done') {
            // Handle function call done event
            console.log('Function call completed:', data.function_name, data.function_arguments);
          } else if (data.text) {
            handleAssistantMessage(data.text);
          }
          break;
        case 'annotation':
          handleAnnotationUpdate(data);
          break;
        case 'audio':
          handleAudioData(data);
          break;
        case 'video':
          handleVideoData(data);
          break;
      }
    };
    
    const success = await aiService.connectToRealtime(callback);
    if (success) {
      console.log('Connected to GLM-Realtime');
    }
  };
  
  // 开始渲染循环
  const startRenderLoop = () => {
    const render = () => {
      if (canvasRef.current && videoRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 清除画布
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // 绘制视频帧
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          
          // 绘制标注
          drawAnnotations(ctx);
          
          // 每隔一定时间发送视频帧到GLM-Realtime（降低频率以节省带宽）
          if (animationFrameRef.current && animationFrameRef.current % 30 === 0) {
            sendVideoFrame();
          }
        }
      }
      animationFrameRef.current = requestAnimationFrame(render);
    };
    
    animationFrameRef.current = requestAnimationFrame(render);
  };
  
  // 发送视频帧
  const sendVideoFrame = () => {
    if (canvasRef.current && isConnected) {
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            aiService.sendVideoFrame(base64);
          };
          reader.readAsDataURL(blob);
        }
      }, 'image/jpeg', 0.8);
    }
  };
  
  // 绘制标注
  const drawAnnotations = (ctx: CanvasRenderingContext2D) => {
    annotations.forEach(annotation => {
      ctx.save();
      ctx.strokeStyle = annotation.color;
      ctx.fillStyle = annotation.color;
      ctx.lineWidth = 2;
      
      switch (annotation.type) {
        case 'arrow':
          drawArrow(ctx, annotation);
          break;
        case 'circle':
          drawCircle(ctx, annotation);
          break;
        case 'text':
          drawText(ctx, annotation);
          break;
        case 'highlight':
          drawHighlight(ctx, annotation);
          break;
      }
      
      ctx.restore();
    });
  };
  
  // 绘制箭头
  const drawArrow = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { position, size } = annotation;
    ctx.beginPath();
    ctx.moveTo(position.x, position.y);
    ctx.lineTo(position.x + size.width, position.y + size.height);
    ctx.stroke();
    
    // 绘制箭头头部
    const angle = Math.atan2(size.height, size.width);
    const arrowLength = 15;
    ctx.beginPath();
    ctx.moveTo(position.x + size.width, position.y + size.height);
    ctx.lineTo(
      position.x + size.width - arrowLength * Math.cos(angle - Math.PI / 6),
      position.y + size.height - arrowLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(position.x + size.width, position.y + size.height);
    ctx.lineTo(
      position.x + size.width - arrowLength * Math.cos(angle + Math.PI / 6),
      position.y + size.height - arrowLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.stroke();
  };
  
  // 绘制圆圈
  const drawCircle = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { position, size } = annotation;
    ctx.beginPath();
    ctx.arc(position.x, position.y, Math.max(size.width, size.height) / 2, 0, Math.PI * 2);
    ctx.stroke();
  };
  
  // 绘制文本
  const drawText = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { position, content } = annotation;
    ctx.font = '16px Arial';
    ctx.fillStyle = annotation.color;
    ctx.fillText(content, position.x, position.y);
  };
  
  // 绘制高亮
  const drawHighlight = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { position, size } = annotation;
    ctx.fillStyle = `${annotation.color}40`; // 半透明
    ctx.fillRect(position.x, position.y, size.width, size.height);
  };
  
  // 处理助手消息
  const handleAssistantMessage = (text: string) => {
    setMessages(prev => [...prev, { role: 'assistant', text }]);
    setIsTyping(false);
    
    // 更新虚拟人状态
    setAvatarState(prev => ({
      ...prev,
      speech: text,
      mouthShape: 'talking',
      expression: 'happy'
    }));
    
    // 3秒后恢复默认状态
    setTimeout(() => {
      setAvatarState(prev => ({
        ...prev,
        mouthShape: 'closed',
        expression: 'neutral'
      }));
    }, 3000);
  };
  
  // 处理标注更新
  const handleAnnotationUpdate = (data: any) => {
    switch (data.action) {
      case 'add':
        setAnnotations(prev => [...prev, data.annotation]);
        break;
      case 'update':
        setAnnotations(prev => prev.map(a => a.id === data.id ? { ...a, ...data.updates } : a));
        break;
      case 'delete':
        setAnnotations(prev => prev.filter(a => a.id !== data.id));
        break;
    }
  };
  
  // 处理音频数据
  const handleAudioData = (data: any) => {
    if (data.audio) {
      try {
        const audio = new Audio(`data:audio/wav;base64,${data.audio}`);
        audio.play();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };
  
  // 处理视频数据
  const handleVideoData = (data: any) => {
    // 处理从服务器返回的视频数据
    console.log('Received video data:', data);
  };
  
  // 发送消息
  const sendMessage = () => {
    if (!inputValue.trim()) return;
    
    const message = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', text: message }]);
    setInputValue('');
    setIsTyping(true);
    
    // 发送到GLM-Realtime
    aiService.sendTextMessage(message);
  };
  
  // 切换视频
  const toggleVideo = () => {
    if (videoStream) {
      const videoTracks = videoStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !isVideoOn;
      });
      setIsVideoOn(!isVideoOn);
    }
  };
  
  // 切换音频
  const toggleAudio = () => {
    if (audioStream) {
      const audioTracks = audioStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isAudioOn;
      });
      setIsAudioOn(!isAudioOn);
    }
  };
  
  // 添加标注
  const addAnnotation = (type: 'arrow' | 'circle' | 'text' | 'highlight', content: string = '') => {
    const newAnnotation = aiService.addAnnotation({
      type,
      position: { x: 100, y: 100 },
      size: { width: 100, height: 50 },
      content: content || '标注内容',
      color: '#FF5722'
    });
    
    if (newAnnotation) {
      setAnnotations(prev => [...prev, newAnnotation]);
    }
  };
  
  // 清理资源
  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    aiService.disconnectFromRealtime();
  };
  
  // 显示OCR消息
  const showOcrMessage = (type: 'info' | 'success' | 'error', text: string) => {
    setOcrMessage({ type, text });
    setTimeout(() => setOcrMessage({ type: 'info', text: '' }), 3000);
  };
  
  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageOcr(file);
    }
  };
  
  // 处理OCR识别
  const processImageOcr = async (file: File) => {
    try {
      setIsOcrProcessing(true);
      showOcrMessage('info', '正在识别图片中的文字...');
      
      // 显示上传的图片
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        setOcrImage(imageUrl);
      };
      reader.readAsDataURL(file);
      
      // 调用OCR服务
      const ocrResult = await aiService.recognizeHandwriting(file, {
        languageType: 'CHN_ENG',
        probability: true
      });
      
      if (ocrResult.status === 'succeeded') {
        const recognizedText = ocrResult.words_result
          .map((item: any) => item.words)
          .join('\n');
        
        setOcrResult(recognizedText);
        showOcrMessage('success', 'OCR识别成功');
        
        // 将识别结果发送到聊天
        if (recognizedText) {
          const message = `OCR识别结果:\n${recognizedText}`;
          setMessages(prev => [...prev, { role: 'user', text: message }]);
          aiService.sendTextMessage(message);
        }
      } else {
        showOcrMessage('error', 'OCR识别失败');
      }
    } catch (error) {
      console.error('OCR处理失败:', error);
      showOcrMessage('error', 'OCR处理失败，请检查API密钥是否正确');
    } finally {
      setIsOcrProcessing(false);
    }
  };
  
  // 清除OCR结果
  const clearOcrResults = () => {
    setOcrResult('');
    setOcrImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // 打开文件选择器
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };
  
  // 项目加载中
  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] to-[#1a1d29] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] border-2 border-violet-500/30 p-8 shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-violet-500/20 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Loader2 className="animate-spin" size={40} />
            </div>
            <h1 className="text-2xl font-black text-violet-800 mb-4">正在连接视频服务</h1>
            <p className="text-slate-600">正在验证二维码并初始化视频客服...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project || projectError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] to-[#1a1d29] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] border-2 border-red-500/30 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-500/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-2xl font-black text-red-800 mb-4">视频服务不可用</h1>
            <p className="text-slate-600 text-center mb-4">
              {projectError || '找不到对应的项目信息，请检查二维码是否正确。'}
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>可能的解决方案：</strong><br/>
                • 检查二维码是否有效<br/>
                • 确认产品服务状态<br/>
                • 刷新页面重新尝试<br/>
                • 联系中恒创世技术支持
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
              >
                重新连接
              </button>
              <button 
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!project) return <div className="p-10 text-center text-white bg-slate-900 h-screen flex items-center justify-center">项目加载失败</div>;
  
  // 显示连接错误
  if (connectionStatus === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0c10] to-[#1a1d29] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] border-2 border-red-500/30 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-500/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle size={40} />
            </div>
            <h1 className="text-2xl font-black text-red-800 mb-4">视频客服连接失败</h1>
            <p className="text-slate-600 text-center mb-4">{connectionError}</p>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>可能的解决方案：</strong><br/>
                • 检查摄像头和麦克风权限<br/>
                • 确保设备未被其他应用占用<br/>
                • 刷新页面重新尝试<br/>
                • 联系技术支持获取帮助
              </p>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 px-4 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all"
              >
                重新连接
              </button>
              <button 
                onClick={() => window.history.back()}
                className="flex-1 px-4 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-all"
              >
                返回
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen w-full max-w-6xl mx-auto bg-[#0a0c10] shadow-2xl relative overflow-hidden font-sans">
      {/* 顶部状态栏 */}
      <header className="bg-[#0f1218]/80 backdrop-blur-3xl p-6 text-white shrink-0 border-b border-white/5 z-20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 purple-gradient-btn rounded-2xl flex items-center justify-center">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="font-black text-lg">{project.name} - 视频客服</h1>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-emerald-400 animate-pulse' : 
                    connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
                    connectionStatus === 'error' ? 'bg-red-500' : 'bg-red-500'
                  }`}></span>
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {connectionStatus === 'connected' ? '已连接' : 
                     connectionStatus === 'connecting' ? '连接中' :
                     connectionStatus === 'error' ? '连接失败' : '未连接'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                  GLM-Realtime
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-3 bg-white/5 border border-white/10 rounded-xl text-violet-400">
              <Globe size={20} />
            </button>
            <button className="p-3 purple-gradient-btn text-white rounded-xl">
              <Sparkles size={20} />
            </button>
          </div>
        </div>
      </header>
      
      {/* 主内容区 */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* 视频区域 */}
        <div className="flex-1 relative bg-black">
          <div className="absolute inset-0 flex items-center justify-center">
                  {videoStream ? (
                    <>
                      <video 
                        ref={videoRef} 
                        autoPlay 
                        playsInline 
                        className="w-full h-full object-cover"
                        onMouseDown={(e) => {
                          const pressTimer = setTimeout(async () => {
                            // 长按截屏逻辑
                            if (videoRef.current) {
                              const video = videoRef.current;
                              const canvas = document.createElement('canvas');
                              canvas.width = video.videoWidth;
                              canvas.height = video.videoHeight;
                              const ctx = canvas.getContext('2d');
                              if (ctx) {
                                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                canvas.toBlob(async (blob) => {
                                  if (blob) {
                                    const file = new File([blob], 'screenshot.png', { type: 'image/png' });
                                    // 使用现有的OCR处理函数
                                    await processImageOcr(file);
                                  }
                                });
                              }
                            }
                          }, 800);
                          // 清除定时器
                          const clearTimer = () => clearTimeout(pressTimer);
                          if (videoRef.current) {
                            videoRef.current.onmouseup = clearTimer;
                            videoRef.current.onmouseleave = clearTimer;
                          }
                        }}
                      />
                      <canvas 
                        ref={canvasRef} 
                        className="absolute inset-0 w-full h-full"
                        width={1280}
                        height={720}
                      />
                    </>
                  ) : (
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                        <Video size={48} className="text-violet-400" />
                      </div>
                      <p className="text-white text-lg font-medium">正在初始化视频...</p>
                    </div>
                  )}
                </div>
          
          {/* 底部控制栏 */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-between">
              {/* 视频控制 */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={toggleVideo} 
                  className={`p-3 rounded-full ${isVideoOn ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-400'}`}
                >
                  <Video size={20} />
                </button>
                <button 
                  onClick={toggleAudio} 
                  className={`p-3 rounded-full ${isAudioOn ? 'bg-white/10 text-white' : 'bg-red-500/20 text-red-400'}`}
                >
                  <Mic size={20} />
                </button>
                <button className="p-3 bg-white/10 rounded-full text-white">
                  <Camera size={20} />
                </button>
              </div>
              
              {/* 标注工具 */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => addAnnotation('arrow')} 
                  className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                >
                  <ArrowRight size={16} />
                </button>
                <button 
                  onClick={() => addAnnotation('circle')} 
                  className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                >
                  <Circle size={16} />
                </button>
                <button 
                  onClick={() => addAnnotation('text', '文本标注')} 
                  className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                >
                  <Pencil size={16} />
                </button>
                <button 
                  onClick={() => addAnnotation('highlight')} 
                  className="p-2 bg-white/10 rounded-lg text-white hover:bg-white/20"
                >
                  <Highlighter size={16} />
                </button>
              </div>
              
              {/* 更多控制 */}
              <div className="flex items-center gap-3">
                <button className="p-3 bg-white/10 rounded-full text-white">
                  <Volume2 size={20} />
                </button>
                <button className="p-3 purple-gradient-btn rounded-full text-white">
                  <Video size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* 对话和虚拟人区域 */}
        <div className="w-full md:w-96 flex flex-col bg-[#0f1218]">
          {/* 虚拟人区域 */}
          <div className="h-64 bg-gradient-to-b from-[#1a1d29] to-[#0f1218] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-violet-500 via-transparent to-transparent"></div>
            </div>
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                <Sparkles size={48} className="text-white" />
              </div>
              <h3 className="text-white font-bold text-lg">智能助手</h3>
              <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">
                {avatarState.expression === 'neutral' ? '就绪' : '对话中'}
              </p>
            </div>
          </div>
          
          {/* 对话区域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${msg.role === 'user' ? 'bg-violet-600 text-white' : 'bg-white/5 text-white'}`}>
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white/5 text-white p-3 rounded-lg">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* OCR 消息提示 */}
          {ocrMessage.text && (
            <div className={`mx-4 mb-2 p-2 rounded-lg flex items-center gap-2 ${
              ocrMessage.type === 'success' ? 'bg-green-900/30 text-green-400' :
              ocrMessage.type === 'error' ? 'bg-red-900/30 text-red-400' :
              'bg-blue-900/30 text-blue-400'
            }`}>
              {ocrMessage.type === 'success' && <CheckCircle size={16} />}
              {ocrMessage.type === 'error' && <AlertCircle size={16} />}
              {ocrMessage.type === 'info' && <FileText size={16} />}
              <span className="text-xs">{ocrMessage.text}</span>
            </div>
          )}
          
          {/* OCR 结果显示 */}
          {ocrImage && (
            <div className="mx-4 mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-semibold text-white flex items-center gap-1">
                  <ImageIcon size={14} />
                  OCR 识别结果
                </h4>
                <button
                  onClick={clearOcrResults}
                  className="text-xs text-white/50 hover:text-white transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mb-3">
                <img
                  src={ocrImage}
                  alt="OCR Image"
                  className="w-full h-32 object-contain bg-white/5 rounded"
                />
              </div>
              <div>
                <p className="text-xs text-white/80 whitespace-pre-line">
                  {ocrResult || '识别中...'}
                </p>
              </div>
            </div>
          )}
          
          {/* 输入区域 */}
          <div className="p-4 border-t border-white/5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="输入消息..."
                className="flex-1 bg-white/5 border border-white/10 px-4 py-3 rounded-lg text-white outline-none"
              />
              <button
                onClick={openFilePicker}
                disabled={isOcrProcessing}
                className="p-3 bg-white/5 border border-white/10 rounded-lg text-white hover:bg-white/10 disabled:bg-white/5 disabled:opacity-50 transition-colors"
              >
                {isOcrProcessing ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Upload size={20} />
                )}
              </button>
              <button onClick={sendMessage} className="p-3 purple-gradient-btn rounded-lg text-white">
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoChat;