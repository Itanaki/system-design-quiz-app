import { useEffect, useState } from 'react';
import {
  createQuestion,
  deleteQuestion,
  listAdminQuestions,
  updateQuestion,
  type AdminQuestion,
  type QuestionInput,
} from '../api';
import styles from '../styles/AdminQuestions.module.css';

type Props = {
  onBack: () => void;
};

const emptyForm: QuestionInput = {
  prompt: '',
  options: ['', ''],
  correctAnswer: '',
  explanation: '',
  difficulty: 'easy',
  topics: [],
};

export function AdminQuestions({ onBack }: Props) {
  const [questions, setQuestions] = useState<AdminQuestion[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<
    QuestionInput['difficulty'] | ''
  >('');
  const [topic, setTopic] = useState('');
  const [form, setForm] = useState<QuestionInput>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadQuestions() {
    setLoading(true);
    setError(null);

    try {
      const result = await listAdminQuestions({
        page,
        pageSize: 10,
        search: search || undefined,
        difficulty: difficulty || undefined,
        topic: topic || undefined,
      });

      setQuestions(result.items);
      setTotalPages(result.totalPages);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Unable to load questions',
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadQuestions();
  }, [page, search, difficulty, topic]);

  function updateForm<K extends keyof QuestionInput>(
    field: K,
    value: QuestionInput[K],
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(question: AdminQuestion) {
    setEditingId(question.id);
    setForm({
      prompt: question.prompt,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation ?? '',
      difficulty: question.difficulty,
      topics: question.topics,
    });
    setError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedOptions = form.options
      .map((option) => option.trim())
      .filter(Boolean);

    const normalizedTopics = form.topics
      .map((item) => item.trim())
      .filter(Boolean);

    if (normalizedOptions.length < 2) {
      setError('At least two options are required');
      return;
    }

    if (!normalizedOptions.includes(form.correctAnswer.trim())) {
      setError('Correct answer must match one of the options');
      return;
    }

    if (normalizedTopics.length === 0) {
      setError('At least one topic is required');
      return;
    }

    const input: QuestionInput = {
      ...form,
      prompt: form.prompt.trim(),
      options: normalizedOptions,
      correctAnswer: form.correctAnswer.trim(),
      explanation: form.explanation?.trim(),
      topics: normalizedTopics,
    };

    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await updateQuestion(editingId, input);
      } else {
        await createQuestion(input);
      }

      setForm(emptyForm);
      setEditingId(null);
      await loadQuestions();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save question',
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(question: AdminQuestion) {
    if (!window.confirm(`Delete "${question.prompt}"?`)) {
      return;
    }

    setError(null);

    try {
      await deleteQuestion(question.id);

      if (questions.length === 1 && page > 1) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await loadQuestions();
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Unable to delete question',
      );
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <button className={styles.backButton} type="button" onClick={onBack}>
          Back to quiz
        </button>
        <div>
          <p className={styles.eyebrow}>Content workspace</p>
          <h2>Question administration</h2>
          <p className={styles.subtitle}>
            Manage the questions used in the system design quiz.
          </p>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          className={styles.input}
          value={search}
          placeholder="Search prompts"
          onChange={(event) => {
            setPage(1);
            setSearch(event.target.value);
          }}
        />

        <select
          className={styles.input}
          value={difficulty}
          onChange={(event) => {
            setPage(1);
            setDifficulty(event.target.value as QuestionInput['difficulty'] | '');
          }}
        >
          <option value="">All difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>

        <input
          className={styles.input}
          value={topic}
          placeholder="Filter by topic"
          onChange={(event) => {
            setPage(1);
            setTopic(event.target.value);
          }}
        />
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}

      <div className={styles.workspace}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formHeader}>
            <p className={styles.eyebrow}>Editor</p>
            <h3>{editingId ? 'Edit question' : 'Create question'}</h3>
          </div>

          <label className={styles.field}>
            Prompt
            <input
              className={styles.input}
              required
              value={form.prompt}
              placeholder="Write the question prompt"
              onChange={(event) => updateForm('prompt', event.target.value)}
            />
          </label>

          <fieldset className={styles.fieldset}>
            <legend>Answer options</legend>
            {form.options.map((option, index) => (
              <input
                className={styles.input}
                key={index}
                required
                value={option}
                placeholder={`Option ${index + 1}`}
                onChange={(event) => {
                  const options = [...form.options];
                  options[index] = event.target.value;
                  updateForm('options', options);
                }}
              />
            ))}
          </fieldset>

          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => updateForm('options', [...form.options, ''])}
          >
            Add option
          </button>

          <label className={styles.field}>
            Correct answer
            <input
              className={styles.input}
              required
              value={form.correctAnswer}
              placeholder="Must match one option"
              onChange={(event) =>
                updateForm('correctAnswer', event.target.value)
              }
            />
          </label>

          <label className={styles.field}>
            Explanation
            <textarea
              className={styles.input}
              value={form.explanation ?? ''}
              placeholder="Explain the answer after submission"
              rows={4}
              onChange={(event) =>
                updateForm('explanation', event.target.value)
              }
            />
          </label>

          <div className={styles.twoColumns}>
            <label className={styles.field}>
              Difficulty
              <select
                className={styles.input}
                value={form.difficulty}
                onChange={(event) =>
                  updateForm(
                    'difficulty',
                    event.target.value as QuestionInput['difficulty'],
                  )
                }
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </label>

            <label className={styles.field}>
              Topics
              <input
                className={styles.input}
                required
                value={form.topics.join(', ')}
                placeholder="scalability, caching"
                onChange={(event) =>
                  updateForm('topics', event.target.value.split(','))
                }
              />
            </label>
          </div>

          <div className={styles.formActions}>
            <button className={styles.primaryButton} type="submit" disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update question' : 'Create question'}
            </button>

            {editingId && (
              <button className={styles.secondaryButton} type="button" onClick={startCreate}>
                Cancel edit
              </button>
            )}
          </div>
        </form>

        <div className={styles.questionList}>
          <div className={styles.listHeader}>
            <div>
              <p className={styles.eyebrow}>Library</p>
              <h3>Existing questions</h3>
            </div>
            <span className={styles.count}>{questions.length} shown</span>
          </div>

          {loading ? (
            <p className={styles.emptyState}>Loading questions...</p>
          ) : questions.length === 0 ? (
            <p className={styles.emptyState}>No questions found.</p>
          ) : (
            <div className={styles.cards}>
              {questions.map((question) => (
                <article className={styles.questionCard} key={question.id}>
                  <div className={styles.cardTopline}>
                    <span className={`${styles.badge} ${styles[question.difficulty]}`}>
                      {question.difficulty}
                    </span>
                    <span className={styles.questionId}>{question.id}</span>
                  </div>
                  <h3>{question.prompt}</h3>
                  <p className={styles.metadata}>{question.topics.join('  /  ')}</p>
                  <p className={styles.answer}>Answer: {question.correctAnswer}</p>

                  <div className={styles.cardActions}>
                    <button className={styles.secondaryButton} type="button" onClick={() => startEdit(question)}>
                      Edit
                    </button>

                    <button className={styles.deleteButton} type="button" onClick={() => void handleDelete(question)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.pagination}>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((currentPage) => currentPage - 1)}
        >
          Previous
        </button>

        <span>
          Page {page} of {totalPages}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => setPage((currentPage) => currentPage + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}