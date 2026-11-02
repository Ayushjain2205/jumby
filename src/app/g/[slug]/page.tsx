import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GameFeed } from '@/components/feed/GameFeed';
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

export default async function GamePermalinkPage({ params }: GamePageProps) {
  const { slug } = await params;
  const game = getGameBySlug(slug);

  if (!game) {
    notFound();
  }

  const allGames = getAllGames();
  // Reorder so the requested game is first, followed by the rest of the recommendation feed
  const orderedGames = [
    game,
    ...allGames.filter((g) => g.slug !== slug),
  ];

  return (
    <MobileShell>
      <GameFeed games={orderedGames} initialSlug={slug} />
    </MobileShell>
  );
}
