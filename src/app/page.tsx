import { CreationPageTemplate } from '@/components/CreationPageTemplate';
import { SpidermanAgent } from '@/components/SpidermanAgent';

export default function Home() {
  return (
    <>
      <CreationPageTemplate defaultMethod="direct" />
      <SpidermanAgent />
    </>
  );
}
