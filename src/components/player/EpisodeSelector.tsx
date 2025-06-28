
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlayUrl } from '@/types/movie';

interface EpisodeSelectorProps {
  playUrls: PlayUrl[];
  currentUrl: string;
  onEpisodeSelect: (url: string) => void;
}

export const EpisodeSelector: React.FC<EpisodeSelectorProps> = ({
  playUrls,
  currentUrl,
  onEpisodeSelect
}) => {
  if (playUrls.length === 0) return null;

  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
      <CardContent className="p-4">
        <h3 className="text-white text-base font-semibold mb-3">
          选集播放 ({playUrls.length}集)
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
          {playUrls.map((episode, index) => (
            <Button
              key={index}
              variant={currentUrl === episode.url ? "default" : "ghost"}
              size="sm"
              onClick={() => onEpisodeSelect(episode.url)}
              className={`text-xs h-8 px-2 ${
                currentUrl === episode.url 
                  ? "bg-purple-600 hover:bg-purple-700 text-white" 
                  : "text-white hover:bg-white/10 border border-purple-500/30"
              }`}
            >
              {episode.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
