import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, ArrowLeft, Play, Calendar, Star, AlertCircle, Image, Filter, ChevronDown, ChevronRight } from 'lucide-react';
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [majorCategories, setMajorCategories] = useState<MajorCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
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
      fetchMovies();
    }
  }, [apiUrl]);

  useEffect(() => {
    if (apiUrl && selectedCategory) {
      setCurrentPage(1);
      fetchMovies();
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (apiUrl) {
      fetchMovies();
    }
  }, [currentPage]);

  const getImageUrl = (originalUrl: string) => {
    if (!originalUrl) return '/placeholder.svg';
    
    // 如果是相对路径，尝试构建完整URL
    if (originalUrl.startsWith('/') || originalUrl.startsWith('./')) {
      // 从API URL中提取域名
      try {
        const apiDomain = new URL(apiUrl || '').origin;
        return apiDomain + originalUrl;
      } catch {
        return originalUrl;
      }
    }
    
    // 如果URL不是以http开头，添加https
    if (!originalUrl.startsWith('http')) {
      return 'https://' + originalUrl;
    }
    
    return originalUrl;
  };

  const categorizeMajorCategories = (categories: Category[]) => {
    const result: MajorCategory[] = majorCategoryDefinitions.map(def => ({
      ...def,
      categories: []
    }));

    // 其他分类
    const otherCategory: MajorCategory = {
      name: '其他',
      keywords: [],
      categories: [],
      expanded: false
    };

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
      
      // 如果没有匹配到任何大分类，放入其他
      if (!assigned) {
        otherCategory.categories.push(category);
      }
    });

    // 只返回有内容的大分类
    const finalResult = result.filter(cat => cat.categories.length > 0);
    if (otherCategory.categories.length > 0) {
      finalResult.push(otherCategory);
    }

    return finalResult;
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
        if (!response.ok) throw new Error('Direct request failed');
        console.log('分类直接请求成功');
      } catch (error) {
        console.log('分类直接请求失败，尝试使用代理...', error);
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl);
          console.log('分类代理请求成功');
        } catch (proxyError) {
          console.log('分类代理1失败，尝试备用代理...', proxyError);
          const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl2);
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
    } finally {
      setCategoriesLoading(false);
    }
  };

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setCorsError(false);
      
      let url = `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}pg=${currentPage}`;
      
      // 如果选择了分类，添加分类参数
      if (selectedCategory) {
        url += `&t=${selectedCategory}`;
      }
      
      console.log('正在请求影片:', url);
      
      let response;
      try {
        response = await fetch(url);
        if (!response.ok) throw new Error('Direct request failed');
        console.log('影片直接请求成功');
      } catch (error) {
        console.log('影片直接请求失败，尝试使用代理...', error);
        try {
          const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl);
          console.log('影片代理请求成功');
        } catch (proxyError) {
          console.log('影片代理1失败，尝试备用代理...', proxyError);
          const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(url)}`;
          response = await fetch(proxyUrl2);
          console.log('影片备用代理请求成功');
        }
      }
      
      const data = await response.json();
      console.log('获取到的影片数据:', data);
      
      if (data.list && Array.isArray(data.list)) {
        setMovies(data.list);
        console.log('成功加载影片数据:', data.list.length, '部影片');
        
        // 打印前几个影片的图片URL用于调试
        data.list.slice(0, 3).forEach((movie: Movie) => {
          console.log(`影片: ${movie.vod_name}, 原始图片URL: ${movie.vod_pic}, 处理后: ${getImageUrl(movie.vod_pic)}`);
        });
      } else {
        console.error('影片数据格式错误:', data);
        toast({
          title: "数据格式错误",
          description: "API返回的数据格式不正确",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('请求影片失败:', error);
      setCorsError(true);
      toast({
        title: "连接失败",
        description: "无法连接到数据源，请检查API地址或网络连接",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredMovies = movies.filter(movie =>
    movie.vod_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleMovieClick = (movie: Movie) => {
    navigate(`/player?api=${encodeURIComponent(apiUrl || '')}&id=${movie.vod_id}`);
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const toggleMajorCategory = (index: number) => {
    setMajorCategories(prev => prev.map((cat, i) => 
      i === index ? { ...cat, expanded: !cat.expanded } : cat
    ));
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
            
            {/* 全部按钮 */}
            <div className="mb-4">
              <Button
                variant={selectedCategory === '' ? "default" : "ghost"}
                onClick={() => handleCategoryChange('')}
                className={`text-sm h-9 ${
                  selectedCategory === '' 
                    ? "bg-purple-600 hover:bg-purple-700 text-white" 
                    : "text-white hover:bg-white/10 border border-purple-500/30"
                }`}
              >
                全部
              </Button>
            </div>

            {/* 大分类 */}
            <div className="space-y-3">
              {majorCategories.map((majorCat, index) => (
                <div key={majorCat.name} className="border border-purple-500/20 rounded-lg bg-white/5">
                  {/* 大分类标题 */}
                  <Button
                    variant="ghost"
                    onClick={() => toggleMajorCategory(index)}
                    className="w-full justify-between text-white hover:bg-white/10 p-3 h-auto"
                  >
                    <span className="font-medium">{majorCat.name} ({majorCat.categories.length})</span>
                    {majorCat.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {/* 小分类 */}
                  {majorCat.expanded && (
                    <div className="p-3 pt-0">
                      <div className="grid grid-cols-3 gap-2">
                        {majorCat.categories.map((category) => (
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
              ))}
            </div>
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
                    onClick={fetchMovies}
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

      {/* Loading indicator for category change */}
      {loading && movies.length > 0 && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400 mr-2" />
            <span className="text-white">正在加载...</span>
          </div>
        </div>
      )}

      {/* Movies Grid */}
      <div className="container mx-auto px-4 py-8">
        {movies.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredMovies.map((movie) => (
              <Card
                key={movie.vod_id}
                className="bg-white/10 backdrop-blur-md border-purple-500/20 hover:bg-white/20 transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={() => handleMovieClick(movie)}
              >
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="w-full h-64 bg-gray-800 rounded-t-lg overflow-hidden relative">
                      {movie.vod_pic ? (
                        <img
                          src={getImageUrl(movie.vod_pic)}
                          alt={movie.vod_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            console.log('图片加载失败，原始URL:', movie.vod_pic);
                            console.log('处理后URL:', getImageUrl(movie.vod_pic));
                            
                            // 尝试不同的图片代理服务
                            const originalUrl = movie.vod_pic;
                            const proxyUrls = [
                              `https://images.weserv.nl/?url=${encodeURIComponent(originalUrl)}&w=300&h=400&fit=cover`,
                              `https://wsrv.nl/?url=${encodeURIComponent(originalUrl)}&w=300&h=400&fit=cover`,
                              `https://api.allorigins.win/raw?url=${encodeURIComponent(originalUrl)}`,
                              `https://corsproxy.io/?${encodeURIComponent(originalUrl)}`,
                              '/placeholder.svg'
                            ];
                            
                            // 获取当前尝试的代理索引
                            const currentIndex = target.dataset.proxyIndex ? parseInt(target.dataset.proxyIndex) : 0;
                            
                            if (currentIndex < proxyUrls.length - 1) {
                              target.dataset.proxyIndex = (currentIndex + 1).toString();
                              target.src = proxyUrls[currentIndex + 1];
                              console.log(`尝试代理 ${currentIndex + 1}:`, proxyUrls[currentIndex + 1]);
                            } else {
                              console.log('所有代理都失败，使用占位图');
                              target.src = '/placeholder.svg';
                            }
                          }}
                          onLoad={() => {
                            console.log('图片加载成功:', movie.vod_name);
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-700">
                          <Image className="h-16 w-16 text-gray-500" />
                          <span className="text-gray-400 text-sm ml-2">暂无海报</span>
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <Play className="h-12 w-12 text-white" />
                      </div>
                      
                      {movie.vod_remarks && (
                        <div className="absolute top-2 right-2 bg-purple-600 text-white px-2 py-1 rounded text-xs">
                          {movie.vod_remarks}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-semibold mb-2 line-clamp-2 h-12">
                      {movie.vod_name}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-300">
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
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center text-white py-12">
              <p className="text-xl">没有找到相关影片</p>
              <p className="text-gray-400 mt-2">请检查API地址或尝试重新加载</p>
              <Button 
                onClick={fetchMovies}
                className="mt-4 bg-purple-600 hover:bg-purple-700"
              >
                重新加载
              </Button>
            </div>
          )
        )}

        {/* Pagination */}
        {movies.length > 0 && (
          <div className="flex justify-center mt-8 space-x-2">
            <Button
              variant="ghost"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="text-white hover:bg-white/10"
            >
              上一页
            </Button>
            <span className="text-white flex items-center px-4">
              第 {currentPage} 页
            </span>
            <Button
              variant="ghost"
              onClick={() => setCurrentPage(currentPage + 1)}
              className="text-white hover:bg-white/10"
            >
              下一页
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Movies;