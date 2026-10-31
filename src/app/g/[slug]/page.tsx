import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GameFeed } from '@/components/feed/GameFeed';
import { AppHeader } from '@/components/layout/AppHeader';
import { SEED_GAMES } from '@/data/seed-games';

interface GamePageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateStaticParams() {
  return SEED_GAMES.map((game) => ({
    slug: game.slug,
  }));
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  const game = SEED_GAMES.find((g) => g.slug === slug);

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
  const game = SEED_GAMES.find((g) => g.slug === slug);

  if (!game) {
    notFound();
  }

  // Reorder so the requested game is first, followed by the rest of the recommendation feed
  const orderedGames = [
    game,
    ...SEED_GAMES.filter((g) => g.slug !== slug),
  ];

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
      <AppHeader />
      <GameFeed games={orderedGames} initialSlug={slug} />
    </main>
  );
}
