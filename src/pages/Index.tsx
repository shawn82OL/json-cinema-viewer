
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Film, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [apiUrl, setApiUrl] = useState('');
  const navigate = useNavigate();

  const defaultApis = [
    {
      name: '黑木耳资源',
      url: 'https://json.heimuer.xyz/api.php/provide/vod/?ac=list',
      description: '高清影视资源'
    },
    {
      name: '大鱼听听资源',
      url: 'https://caiji.dyttzyapi.com/api.php/provide/vod?ac=list',
      description: '综合影视平台'
    },
    {
      name: 'BF资源',
      url: 'https://bfzyapi.com/api.php/provide/vod/',
      description: '精品影视收录'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiUrl.trim()) {
      navigate(`/movies?api=${encodeURIComponent(apiUrl)}`);
    }
  };

  const handleQuickAccess = (url: string) => {
    navigate(`/movies?api=${encodeURIComponent(url)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <Film className="h-16 w-16 text-purple-400 mr-4" />
              <h1 className="text-6xl font-bold text-white">CineStream</h1>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              探索无限精彩影视内容，支持多源JSON数据接入，享受高品质观影体验
            </p>
          </div>

          {/* API Input Form */}
          <Card className="max-w-2xl mx-auto mb-12 bg-white/10 backdrop-blur-md border-purple-500/20">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Search className="h-5 w-5 text-purple-400" />
                  <label className="text-white font-medium">输入影视JSON接口地址</label>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://api.example.com/movies/..."
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="flex-1 bg-white/10 border-purple-500/30 text-white placeholder:text-gray-400"
                  />
                  <Button 
                    type="submit" 
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    进入
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Quick Access APIs */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">快速访问推荐源</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {defaultApis.map((api, index) => (
                <Card 
                  key={index}
                  className="bg-white/10 backdrop-blur-md border-purple-500/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                  onClick={() => handleQuickAccess(api.url)}
                >
                  <CardContent className="p-6 text-center">
                    <div className="bg-purple-500/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Film className="h-8 w-8 text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{api.name}</h3>
                    <p className="text-gray-300 text-sm mb-4">{api.description}</p>
                    <Button className="bg-purple-600 hover:bg-purple-700 text-white w-full">
                      <Play className="h-4 w-4 mr-2" />
                      访问资源
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-black/30 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-white text-center mb-12">平台特色</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Play className="h-10 w-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">高品质播放</h3>
              <p className="text-gray-300">采用ArtPlayer播放器，支持多种格式，流畅观影体验</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">多源接入</h3>
              <p className="text-gray-300">支持多个JSON数据源，丰富的影视资源库</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-500/20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                <Film className="h-10 w-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">精美界面</h3>
              <p className="text-gray-300">现代化设计，响应式布局，完美适配各种设备</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
