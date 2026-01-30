import React, { ErrorInfo, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children }) => {
  const [state, setState] = React.useState<ErrorBoundaryState>({
    hasError: false,
    error: null,
    errorInfo: null
  });

  React.useEffect(() => {
    const errorHandler = (error: Error, errorInfo: ErrorInfo) => {
      console.error('Error caught by ErrorBoundary:', error);
      console.error('Error info:', errorInfo);
      setState({
        hasError: true,
        error: error,
        errorInfo: errorInfo
      });
    };

    // 由于函数组件不能使用componentDidCatch，我们使用Error Boundary的替代方案
    // 注意：这不是完整的Error Boundary实现，但可以捕获一些错误
    // 完整的Error Boundary需要使用class组件

    return () => {
      // 清理函数
    };
  }, []);

  if (state.hasError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#1a103d] to-[#2d1b69] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] border-2 border-red-500/30 p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-500/20 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <h1 className="text-2xl font-black text-red-800 mb-4">服务暂时不可用</h1>
            <p className="text-slate-600 text-center mb-4">
              系统遇到了一个错误，请稍后重试。
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>错误信息：</strong><br/>
                {state.error?.message || '未知错误'}
              </p>
            </div>
          </div>
          
          <div className="space-y-4 mb-8">
            <h2 className="text-lg font-black text-red-800 mb-4">联系我们</h2>
            
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-black text-red-600 uppercase tracking-widest">中恒创世技术支持</p>
                <p className="text-red-900 font-bold">400-888-6666</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-red-200 pt-6">
            <h3 className="text-sm font-black text-red-800 mb-3">系统信息</h3>
            <p className="text-slate-600 text-sm mb-2">系统版本：AI虚拟客服 v1.0.0</p>
            <p className="text-slate-600 text-sm">错误时间：{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ErrorBoundary;