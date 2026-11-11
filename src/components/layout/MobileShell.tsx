import { WalletProvider } from '@/context/WalletContext';
import { PaymentModal } from '@/components/modals/PaymentModal';
import { RewardedAdModal } from '@/components/modals/RewardedAdModal';
import { CoinShopModal } from '@/components/modals/CoinShopModal';

interface MobileShellProps {
  children: React.ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <WalletProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-jumby-ink flex items-center justify-center font-sans">
        {/* Desktop Ambient Brand Glow */}
        <div className="absolute inset-0 pointer-events-none hidden md:block overflow-hidden">
          {/* Jumby Purple Glow */}
          <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-jumby-purple/15 rounded-full blur-[140px]" />
          {/* Jumby Lime Glow */}
          <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-jumby-lime/10 rounded-full blur-[150px]" />
          {/* Jumby Coral subtle warm touch */}
          <div className="absolute top-1/2 right-1/3 w-[350px] h-[350px] bg-jumby-coral/10 rounded-full blur-[120px]" />
        </div>

        {/* Mobile Device Frame */}
        <div className="relative w-full h-full md:w-[420px] md:h-[92vh] md:max-h-[860px] md:rounded-[44px] md:border-[5px] md:border-zinc-800/80 md:shadow-[0_0_60px_rgba(0,0,0,0.9),0_0_80px_rgba(113,96,255,0.15)] overflow-hidden bg-jumby-ink flex flex-col z-10">
          {/* Inner Content (Feed + Modals) */}
          <div className="relative w-full h-full overflow-hidden bg-jumby-ink">
            {children}
            <PaymentModal />
            <RewardedAdModal />
            <CoinShopModal />
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}
