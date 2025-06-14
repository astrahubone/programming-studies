import { supabase } from './supabase';

export async function resetStudyData() {
  try {
    // Get all study sessions for the current user
    const { data: sessions, error: sessionsError } = await supabase
      .from('study_sessions')
      .select('id');

    if (sessionsError) throw sessionsError;
    if (!sessions || sessions.length === 0) {
      return { success: true }; // No data to reset
    }

    const sessionIds = sessions.map(s => s.id);

    // Delete all study session questions for these sessions
    const { error: deleteSessionQuestionsError } = await supabase
      .from('study_session_questions')
      .delete()
      .in('study_session_id', sessionIds);

    if (deleteSessionQuestionsError) throw deleteSessionQuestionsError;

    // Get all sub_subjects for the current user
    const { data: subSubjects, error: subSubjectsError } = await supabase
      .from('sub_subjects')
      .select('id, subject:subjects!inner(user_id)');

    if (subSubjectsError) throw subSubjectsError;
    if (!subSubjects || subSubjects.length === 0) {
      return { success: true }; // No data to reset
    }

    const subSubjectIds = subSubjects.map(s => s.id);

    // Delete all questions for these sub_subjects
    const { error: deleteQuestionsError } = await supabase
      .from('questions')
      .delete()
      .in('sub_subject_id', subSubjectIds);

    if (deleteQuestionsError) throw deleteQuestionsError;

    // Reset study sessions
    const { error: resetSessionsError } = await supabase
      .from('study_sessions')
      .update({
        completed_at: null,
        questions_total: null,
        questions_correct: null
      })
      .in('id', sessionIds);

    if (resetSessionsError) throw resetSessionsError;

    return { success: true };
  } catch (error) {
    console.error('Error resetting study data:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}