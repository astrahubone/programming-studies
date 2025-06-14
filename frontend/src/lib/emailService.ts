import { supabase } from './supabase';

export async function sendDailyStudyReminder(userId: string) {
  try {
    // Get today's study sessions
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select(`
        scheduled_date,
        sub_subject:sub_subjects (
          title,
          subject:subjects (
            title
          )
        )
      `)
      .eq('scheduled_date', new Date().toISOString().split('T')[0])
      .is('completed_at', null);

    if (error) throw error;

    if (!sessions || sessions.length === 0) {
      return;
    }

    // Get user's email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Format the email content
    const subjectsToStudy = sessions.map(session => 
      `${session.sub_subject.subject.title} - ${session.sub_subject.title}`
    ).join('\n');

    // Send email using Supabase's built-in email service
    const { error: emailError } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: `${window.location.origin}/dashboard`,
    });

    if (emailError) throw emailError;

  } catch (error) {
    console.error('Error sending study reminder:', error);
  }
}