import { AppLayout } from '@/components/layout/app-layout'
import { QuizEngine } from '@/components/practicar/quiz-engine'
import { type Category } from '@/lib/sign-data'

interface PageProps {
  params: Promise<{ category: string; difficulty: string }>
}

export default async function Page({ params }: PageProps) {
  const { category, difficulty } = await params
  return (
    <AppLayout title="Quiz">
      <QuizEngine
        category={category as Category}
        difficulty={difficulty as 'facil' | 'intermedio' | 'dificil'}
      />
    </AppLayout>
  )
}
