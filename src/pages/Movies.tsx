import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowLeft, Play, Calendar, Star, AlertCircle, Image, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Movie {
  vod_id: string;
  vod_name: string;
  vod_pic: string;
  vod_remarks: string;
  vod_year: string;
  vod_score: string;
  vod_content: string;
  vod_play_url?: string;
  type_id?: string;
  type_name?: string;
}

interface Category {
  type_id: string;
  type_name: string;
}

interface MajorCategory {
  name: string;
  keywords: string[];
  categories: Category[];
  expanded: boolean;
}

const Movies = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [allMovies, setAllMovies] = useState<Movie[]>([]); // 存储所有电影用于搜索
  const [categories, setCategories] = useState<Category[]>([]);
  const [majorCategories, setMajorCategories] = useState<MajorCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedMajorCategory, setSelectedMajorCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [corsError, setCorsError] = useState(false);
  const apiUrl = searchParams.get('api');

  // 定义大分类及其关键词
  const majorCategoryDefinitions = [
    {
      name: '电影',
      keywords: ['电影', '影片', '剧情片', '动作片', '喜剧片', '爱情片', '科幻片', '恐怖片', '悬疑片', '战争片', '纪录片'],
      expanded: false
    },
    {
      name: '电视剧',
      keywords: ['电视剧', '连续剧', '剧集', '国产剧', '港剧', '台剧', '日剧', '韩剧', '美剧', '英剧', '泰剧'],
      expanded: false
    },
    {
      name: '综艺',
      keywords: ['综艺', '娱乐', '真人秀', '脱口秀', '选秀', '访谈', '游戏', '竞技'],
      expanded: false
    },
    {
      name: '动漫',
      keywords: ['动漫', '动画', '动画片', '卡通', '番剧', '国漫', '日漫', '美漫'],
      expanded: false
    },
    {
      name: '短剧',
      keywords: ['短剧', '微剧', '网剧', '迷你剧', '短片'],
      expanded: false
    }
  ];

  useEffect(() => {
    if (apiUrl) {
      fetchCategories();
      fetchMovies(true); // 初始加载
    }
  }, [apiUrl]);

  useEffect(() => {
    if (apiUrl && selectedCategory !== undefined) {
      setMovies([]); // 清空现有影片
      setCurrentPage(1);
      setHasMore(true);
      fetchMovies(true); // 重新加载
    }
  }, [selectedCategory]);

  // 搜索功能
  useEffect(() => {
    if (searchTerm.trim()) {
      handleSearch();
    } else {
      // 如果搜索词为空，显示所有电影
      setMovies(allMovies);
      setIsSearching(false);
    }
  }, [searchTerm, allMovies]);

  // 无限滚动监听
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop
        >= document.documentElement.offsetHeight - 1000 // 提前1000px开始加载
        && !loading && !loadingMore && hasMore && !isSearching
      ) {
        loadMoreMovies();
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMore, isSearching]);

  // 改进的图片URL处理函数
  const getImageUrl = (originalUrl: string) => {
    console.log('=== 图片URL处理开始 ===');
    console.log('原始URL:', originalUrl);
    console.log('URL类型:', typeof originalUrl);
    console.log('URL长度:', originalUrl ? originalUrl.length : 0);
    
    if (!originalUrl || originalUrl.trim() === '') {
      console.log('❌ 没有原始图片URL或URL为空');
      return '/placeholder.svg';
    }
    
    // 清理URL，移除多余的空格和特殊字符
    let cleanUrl = originalUrl.trim();
    console.log('清理后URL:', cleanUrl);
    
    // 如果已经是完整的HTTP/HTTPS URL，直接返回
    if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
      console.log('✅ 返回完整URL:', cleanUrl);
      return cleanUrl;
    }
    
    // 如果是相对路径，尝试构建完整URL
    if (cleanUrl.startsWith('/') || cleanUrl.startsWith('./')) {
      try {
        const apiDomain = new URL(apiUrl || '').origin;
        const finalUrl = apiDomain + (cleanUrl.startsWith('./') ? cleanUrl.substring(1) : cleanUrl);
        console.log('✅ 构建的完整URL:', finalUrl);
        return finalUrl;
      } catch (error) {
        console.log('❌ 构建URL失败:', error);
        return cleanUrl;
      }
    }
    
    // 如果URL不是以http开头，添加https
    if (!cleanUrl.startsWith('http')) {
      const finalUrl = 'https://' + cleanUrl;
      console.log('✅ 添加https后的URL:', finalUrl);
      return finalUrl;
    }
    
    console.log('✅ 最终返回URL:', cleanUrl);
    return cleanUrl;
  };

  // 验证响应是否为有效JSON的辅助函数
  const validateJsonResponse = async (response: Response) => {
    if (!response || !response.ok) {
      throw new Error(`HTTP error! status: ${response?.status || 'unknown'}`);
    }

    // Remove the strict Content-Type check since some APIs return JSON with incorrect headers
    // The response.json() method will handle parsing and throw an error if it's not valid JSON
    return response;
  };

  // 搜索处理函数
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setMovies(allMovies);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    
    try {
      // 构建搜索API URL
      let searchUrl = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}ac=detail&wd=${encodeURIComponent(searchTerm.trim())}`;
      
      console.log('正在搜索:', searchUrl);
      
      let response;
      try {
        response = await fetch(searchUrl);
        await validateJsonResponse(response);
        console.log('搜索直接请求成功');
      } catch (error) {
        console.log('搜索直接请求失败，尝试使用代理...', error);
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(searchUrl)}`;
          response = await fetch(proxyUrl);
          await validateJsonResponse(response);
          console.log('搜索代理请求成功');
        } catch (proxyError) {
          console.log('搜索代理1失败，尝试备用代理...', proxyError);
          const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(searchUrl)}`;
          response = await fetch(proxyUrl2);
          await validateJsonResponse(response);
          console.log('搜索备用代理请求成功');
        }
      }
      
      const data = await response.json();
      console.log('搜索结果:', data);
      
      if (data.list && Array.isArray(data.list)) {
        setMovies(data.list);
        console.log('搜索成功，找到', data.list.length, '个结果');
        
        if (data.list.length === 0) {
          toast({
            title: "搜索结果",
            description: "没有找到相关影片",
          });
        }
      } else {
        console.log('搜索结果格式错误或无结果');
        setMovies([]);
        toast({
          title: "搜索失败",
          description: "搜索请求失败，请稍后重试",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setMovies([]);
      toast({
        title: "搜索错误",
        description: `搜索时发生错误: ${error instanceof Error ? error.message : '未知错误'}`,
        variant: "destructive"
      });
    }
  };

  const categorizeMajorCategories = (categories: Category[]) => {
    const result: MajorCategory[] = majorCategoryDefinitions.map(def => ({
      ...def,
      categories: []
    }));

    categories.forEach(category => {
      let assigned = false;
      
      // 检查每个大分类
      for (const majorCat of result) {
        if (majorCat.keywords.some(keyword => 
          category.type_name.toLowerCase().includes(keyword.toLowerCase()) ||
          keyword.toLowerCase().includes(category.type_name.toLowerCase())
        )) {
          majorCat.categories.push(category);
          assigned = true;
          break;
        }
      }
    });

    // 只返回有内容的大分类，并按分类数量排序
    return result
      .filter(cat => cat.categories.length > 0)
      .sort((a, b) => b.categories.length - a.categories.length);
  };

  const fetchCategories = async () => {
    try {
      setCategoriesLoading(true);
      
      // 构建分类API URL
      let url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}ac=list`;
      console.log('正在获取分类:', url);
      
      let response;
      try {
        response = await fetch(url);
        await validateJsonResponse(response);
        console.log('分类直接请求成功');
      } catch (error) {
        console.log('分类直接请求失败，尝试使用代理...', error);
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl);
          await validateJsonResponse(response);
          console.log('分类代理请求成功');
        } catch (proxyError) {
          console.log('分类代理1失败，尝试备用代理...', proxyError);
          const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl2);
          await validateJsonResponse(response);
          console.log('分类备用代理请求成功');
        }
      }
      
      const data = await response.json();
      console.log('获取到的分类数据:', data);
      
      if (data.class && Array.isArray(data.class)) {
        setCategories(data.class);
        const majorCats = categorizeMajorCategories(data.class);
        setMajorCategories(majorCats);
        console.log('成功加载分类数据:', data.class.length, '个分类');
        console.log('大分类分组:', majorCats);
      } else {
        console.log('没有找到分类数据或格式不正确');
        setCategories([]);
        setMajorCategories([]);
      }
    } catch (error) {
      console.error('获取分类失败:', error);
      setCategories([]);
      setMajorCategories([]);
      toast({
        title: "获取分类失败",
        description: `无法获取分类信息: ${error instanceof Error ? error.message : '未知错误'}`,
        variant: "destructive"
      });
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchMovies = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setCorsError(false);
      
      const page = isInitial ? 1 : currentPage;
      let url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}pg=${page}`;
      
      // 如果选择了分类，添加分类参数
      if (selectedCategory) {
        url += `&t=${selectedCategory}`;
      }
      
      console.log('正在请求影片:', url);
      
      let response;
      try {
        response = await fetch(url);
        await validateJsonResponse(response);
        console.log('影片直接请求成功');
      } catch (error) {
        console.log('影片直接请求失败，尝试使用代理...', error);
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl);
          await validateJsonResponse(response);
          console.log('影片代理请求成功');
        } catch (proxyError) {
          console.log('影片代理1失败，尝试备用代理...', proxyError);
          const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl2);
          await validateJsonResponse(response);
          console.log('影片备用代理请求成功');
        }
      }
      
      const data = await response.json();
      console.log('=== 获取到的影片数据 ===');
      console.log('完整数据:', data);
      console.log('数据类型:', typeof data);
      console.log('是否有list:', !!data.list);
      console.log('list类型:', typeof data.list);
      console.log('list长度:', data.list ? data.list.length : 0);
      
      // 详细检查前几个影片的数据结构
      if (data.list && Array.isArray(data.list) && data.list.length > 0) {
        console.log('=== 前3个影片的详细数据 ===');
        data.list.slice(0, 3).forEach((movie: Movie, index: number) => {
          console.log(`影片 ${index + 1}:`, movie);
          console.log(`  - vod_name: ${movie.vod_name}`);
          console.log(`  - vod_pic: ${movie.vod_pic}`);
          console.log(`  - vod_pic类型: ${typeof movie.vod_pic}`);
          console.log(`  - vod_pic长度: ${movie.vod_pic ? movie.vod_pic.length : 0}`);
          console.log(`  - 所有字段:`, Object.keys(movie));
        });
      }
      
      if (data.list && Array.isArray(data.list)) {
        if (isInitial) {
          setMovies(data.list);
          setAllMovies(data.list); // 保存所有电影用于搜索
        } else {
          const newMovies = [...movies, ...data.list];
          setMovies(newMovies);
          setAllMovies(newMovies); // 更新所有电影列表
        }
        
        // 检查是否还有更多数据
        if (data.list.length === 0 || data.list.length < 20) {
          setHasMore(false);
        }
        
        console.log('成功加载影片数据:', data.list.length, '部影片');
      } else {
        console.error('影片数据格式错误:', data);
        if (isInitial) {
          toast({
            title: "数据格式错误",
            description: "API返回的数据格式不正确",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('请求影片失败:', error);
      setCorsError(true);
      if (isInitial) {
        toast({
          title: "连接失败",
          description: `无法连接到数据源: ${error instanceof Error ? error.message : '未知错误'}`,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreMovies = useCallback(() => {
    if (!loading && !loadingMore && hasMore && !isSearching) {
      setCurrentPage(prev => {
        const nextPage = prev + 1;
        // 延迟执行以确保状态更新
        setTimeout(() => fetchMovies(false), 0);
        return nextPage;
      });
    }
  }, [loading, loadingMore, hasMore, isSearching]);

  const handleMovieClick = (movie: Movie) => {
    navigate(`/player?api=${encodeURIComponent(apiUrl || '')}&id=${movie.vod_id}`);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchTerm(''); // 清除搜索词
    setIsSearching(false);
  };

  const handleMajorCategoryClick = (majorCatName: string) => {
    if (selectedMajorCategory === majorCatName) {
      // 如果点击的是当前选中的大分类，则取消选择
      setSelectedMajorCategory('');
      setSelectedCategory('');
    } else {
      // 选择新的大分类
      setSelectedMajorCategory(majorCatName);
      setSelectedCategory(''); // 清除小分类选择
    }
    setSearchTerm(''); // 清除搜索词
    setIsSearching(false);
  };

  // 获取当前选中大分类的小分类
  const getCurrentMajorCategorySubCategories = () => {
    if (!selectedMajorCategory) return [];
    const majorCat = majorCategories.find(cat => cat.name === selectedMajorCategory);
    return majorCat ? majorCat.categories : [];
  };

  if (loading && movies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white text-lg">正在加载影视资源...</p>
          <p className="text-gray-400 text-sm mt-2">正在尝试连接数据源</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                返回
              </Button>
              <h1 className="text-2xl font-bold text-white">影视资源库</h1>
            </div>
            <div className="flex items-center space-x-2 max-w-md">
              <Search className="h-5 w-5 text-purple-400" />
              <Input
                placeholder="搜索影片..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/10 border-purple-500/30 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories Filter */}
      {!categoriesLoading && majorCategories.length > 0 && (
        <div className="bg-black/20 backdrop-blur-md border-b border-purple-500/20">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center space-x-3 mb-4">
              <Filter className="h-5 w-5 text-purple-400" />
              <h2 className="text-lg font-semibold text-white">分类筛选</h2>
            </div>
            
            {/* 大分类 - 横向排列 */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedMajorCategory === '' ? "default" : "ghost"}
                  onClick={() => {
                    setSelectedMajorCategory('');
                    setSelectedCategory('');
                    setSearchTerm('');
                    setIsSearching(false);
                  }}
                  className={`text-sm h-9 ${
                    selectedMajorCategory === '' 
                      ? "bg-purple-600 hover:bg-purple-700 text-white" 
                      : "text-white hover:bg-white/10 border border-purple-500/30"
                  }`}
                >
                  全部
                </Button>
                {majorCategories.map((majorCat) => (
                  <Button
                    key={majorCat.name}
                    variant={selectedMajorCategory === majorCat.name ? "default" : "ghost"}
                    onClick={() => handleMajorCategoryClick(majorCat.name)}
                    className={`text-sm h-9 ${
                      selectedMajorCategory === majorCat.name 
                        ? "bg-purple-600 hover:bg-purple-700 text-white" 
                        : "text-white hover:bg-white/10 border border-purple-500/30"
                    }`}
                  >
                    {majorCat.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* 小分类 - 当选择了大分类时显示 */}
            {selectedMajorCategory && getCurrentMajorCategorySubCategories().length > 0 && (
              <div className="border border-purple-500/20 rounded-lg bg-white/5 p-3">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-white font-medium text-sm">{selectedMajorCategory}分类:</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {getCurrentMajorCategorySubCategories().map((category) => (
                    <Button
                      key={category.type_id}
                      variant={selectedCategory === category.type_id ? "default" : "ghost"}
                      onClick={() => handleCategoryChange(category.type_id)}
                      className={`text-xs h-8 truncate ${
                        selectedCategory === category.type_id 
                          ? "bg-purple-600 hover:bg-purple-700 text-white" 
                          : "text-white hover:bg-white/10 border border-purple-500/30"
                      }`}
                      title={category.type_name}
                    >
                      {category.type_name}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CORS错误提示 */}
      {corsError && movies.length === 0 && (
        <div className="container mx-auto px-4 py-6">
          <Card className="bg-yellow-900/50 border-yellow-600/50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-6 w-6 text-yellow-400 mt-1" />
                <div>
                  <h3 className="text-yellow-200 font-semibold mb-2">连接问题</h3>
                  <p className="text-yellow-100 text-sm mb-3">
                    由于浏览器安全限制，无法直接访问该API。正在尝试使用代理服务...
                  </p>
                  <Button 
                    onClick={() => fetchMovies(true)}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    重试连接
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search Status */}
      {isSearching && searchTerm && (
        <div className="container mx-auto px-4 py-2">
          <div className="text-center">
            <p className="text-white text-sm">
              搜索 "{searchTerm}" 的结果 ({movies.length} 个结果)
            </p>
          </div>
        </div>
      )}

      {/* Movies Grid */}
      <div className="container mx-auto px-4 py-8">
        {movies.length > 0 ? (
          <>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
              {movies.map((movie) => {
                console.log(`=== 渲染影片: ${movie.vod_name} ===`);
                console.log('影片数据:', movie);
                console.log('vod_pic值:', movie.vod_pic);
                console.log('vod_pic类型:', typeof movie.vod_pic);
                
                const imageUrl = getImageUrl(movie.vod_pic);
                console.log(`最终图片URL: ${imageUrl}`);
                
                return (
                  <Card
                    key={movie.vod_id}
                    className="bg-white/10 backdrop-blur-md border-purple-500/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                    onClick={() => handleMovieClick(movie)}
                  >
                    <CardContent className="p-0">
                      <div className="relative">
                        <div className="w-full aspect-[3/4] bg-gray-800 rounded-t-lg overflow-hidden relative">
                          {movie.vod_pic && movie.vod_pic.trim() !== '' ? (
                            <img
                              src={imageUrl}
                              alt={movie.vod_name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                console.log('❌ 图片加载失败，影片:', movie.vod_name);
                                console.log('❌ 失败的URL:', target.src);
                                console.log('❌ 原始URL:', movie.vod_pic);
                                
                                // 尝试不同的图片代理服务
                                const originalUrl = movie.vod_pic;
                                const proxyUrls = [
                                  `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=300&h=400&fit=cover&output=webp`,
                                  `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=300&h=400&fit=cover`,
                                  `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
                                  `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`,
                                  `https://proxy.cors.sh/${originalUrl}`,
                                  '/placeholder.svg'
                                ];
                                
                                // 获取当前尝试的代理索引
                                const currentIndex = target.dataset.proxyIndex ? parseInt(target.dataset.proxyIndex) : 0;
                                
                                if (currentIndex < proxyUrls.length - 1) {
                                  target.dataset.proxyIndex = (currentIndex + 1).toString();
                                  target.src = proxyUrls[currentIndex + 1];
                                  console.log(`🔄 尝试代理 ${currentIndex + 1}:`, proxyUrls[currentIndex + 1]);
                                } else {
                                  console.log('❌ 所有代理都失败，使用占位图');
                                  target.src = '/placeholder.svg';
                                }
                              }}
                              onLoad={() => {
                                console.log('✅ 图片加载成功:', movie.vod_name);
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-gray-700">
                              <Image className="h-8 w-8 text-gray-500 mb-1" />
                              <span className="text-gray-400 text-xs text-center px-1">暂无海报</span>
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                          
                          {movie.vod_remarks && (
                            <div className="absolute top-1 right-1 bg-purple-600 text-white px-1 py-0.5 rounded text-xs">
                              {movie.vod_remarks}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="p-2">
                        <h3 className="text-white font-medium text-sm mb-1 line-clamp-2 h-10 leading-5">
                          {movie.vod_name}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-gray-300">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{movie.vod_year || '未知'}</span>
                          </div>
                          {movie.vod_score && (
                            <div className="flex items-center space-x-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              <span>{movie.vod_score}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Loading More Indicator */}
            {loadingMore && (
              <div className="flex items-center justify-center mt-8">
                <Loader2 className="h-6 w-6 animate-spin text-purple-400 mr-2" />
                <span className="text-white">正在加载更多...</span>
              </div>
            )}

            {/* No More Data Indicator */}
            {!hasMore && movies.length > 0 && !isSearching && (
              <div className="text-center mt-8">
                <p className="text-gray-400">已加载全部内容</p>
              </div>
            )}
          </>
        ) : (
          !loading && (
            <div className="text-center text-white py-12">
              <p className="text-xl">
                {isSearching ? `没有找到包含 "${searchTerm}" 的影片` : '没有找到相关影片'}
              </p>
              <p className="text-gray-400 mt-2">
                {isSearching ? '请尝试其他关键词' : '请检查API地址或尝试重新加载'}
              </p>
              {!isSearching && (
                <Button 
                  onClick={() => fetchMovies(true)}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                >
                  重新加载
                </Button>
              )}
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default Movies;