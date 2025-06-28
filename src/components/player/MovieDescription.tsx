
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface MovieDescriptionProps {
  content: string;
}

export const MovieDescription: React.FC<MovieDescriptionProps> = ({ content }) => {
  if (!content) return null;

  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-500/20">
      <CardContent className="p-4">
        <h3 className="text-white text-base font-semibold mb-3">剧情简介</h3>
        <p className="text-gray-300 text-sm leading-relaxed break-words">
          {content.replace(/<[^>]*>/g, '')}
        </p>
      </CardContent>
    </Card>
  );
};
