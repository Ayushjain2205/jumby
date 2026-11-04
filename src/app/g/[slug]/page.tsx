import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DedicatedGamePlayer } from '@/components/game/DedicatedGamePlayer';
import { MobileShell } from '@/components/layout/MobileShell';
import { getAllGames, getGameBySlug } from '@/lib/games/game-registry';

interface GamePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  const games = getAllGames();
  return games.map((game) => ({
    slug: game.slug,
  }));
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    return {
      title: 'Game Not Found | Jumby',
    };
  }

  return {
    title: `${game.title} by @${game.creator.username} | Jumby`,
    description: `${game.description} - Play instantly in your browser on Jumby!`,
    openGraph: {
      title: `${game.title} | Jumby Games`,
      description: `High score: ${game.stats.highScore || 0}. Tap to play instantly!`,
      images: [
        {
          url: game.thumbnailUrl || '/next.svg',
          width: 600,
          height: 600,
          alt: game.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${game.title} | Jumby`,
      description: game.description,
    },
  };
}

async function GamePageContent({ params }: GamePageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  return <DedicatedGamePlayer game={game} />;
}

export default function GamePermalinkPage({ params }: GamePageProps) {
  return (
    <MobileShell>
      <Suspense
        fallback={
          <div className="w-full h-full bg-[#070714] flex items-center justify-center text-zinc-500 font-mono text-xs">
            Loading game...
          </div>
        }
      >
        <GamePageContent params={params} />
      </Suspense>
    </MobileShell>
  );
}
