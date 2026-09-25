import { ensureDist } from './ensure-dist';

export default async function setup(): Promise<void> {
  await ensureDist();
}
