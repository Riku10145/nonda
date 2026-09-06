import { loadTodayBoard } from "@/lib/server/today";
import { TodayView } from "./_ui/today-view";

export default async function HomePage() {
  const board = await loadTodayBoard();
  return <TodayView board={board} />;
}
