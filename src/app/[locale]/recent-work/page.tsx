import RecentWorkPage from "@/components/pages/RecentWorkPage";
import { getAllProjects } from "@/lib/projects";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function RecentWork({ params }: Props) {
  const { locale } = await params;
  const projects = await getAllProjects(locale);
  
  return <RecentWorkPage projects={projects} />;
}