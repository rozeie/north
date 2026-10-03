import Link from "next/link";
import { Shell } from "@/components/Shell";

export default function NotFound() {
  return (
    <Shell nav={false}>
      <p className="eyebrow mb-2">404</p>
      <h1 className="text-title font-semibold tracking-tight">페이지를 찾을 수 없어요</h1>
      <p className="mt-3 text-lead text-muted-foreground">주소가 바뀌었거나 접근할 수 없는 자료예요.</p>
      <Link href="/" className="btn btn-outline mt-6">
        처음으로
      </Link>
    </Shell>
  );
}
