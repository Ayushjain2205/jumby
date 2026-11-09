import React from 'react';
import { Route, Switch } from 'wouter';
import HomePage from './pages/HomePage';
import GamePermalinkPage from './pages/GamePermalinkPage';
import CreateStudioPage from './pages/CreateStudioPage';

export function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/create" component={CreateStudioPage} />
      <Route path="/g/:slug" component={GamePermalinkPage} />
      <Route>
        <div className="w-full h-full bg-[#0F0F0F] flex flex-col items-center justify-center p-6 text-center text-white">
          <h1 className="text-2xl font-bold mb-2 font-heading">404 - Page Not Found</h1>
          <p className="text-zinc-400 mb-6 text-sm">The page you are looking for does not exist.</p>
          <a
            href="/"
            className="px-6 py-2.5 rounded-full bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition"
          >
            Return to Explore
          </a>
        </div>
      </Route>
    </Switch>
  );
}
