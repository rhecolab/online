// Full factorial randomization: every t1 × t2 × lag combination, repeated `reps` times, shuffled.
export function randomizeFull(t1_opts, t2_opts, lags, reps) {
    const trials = [];
    for (const lag of lags)
        for (const t1 of t1_opts)
            for (const t2 of t2_opts)
                for (let r = 0; r < reps; r++)
                    trials.push({ t1, t2, lag });
 
    // Fisher-Yates shuffle
    for (let i = trials.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trials[i], trials[j]] = [trials[j], trials[i]];
    }
    return trials;
}
 
const DISTRACTORS = {
    shape: ['circle', 'square', 'triangle', 'pentagon'],
    vis:   ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'],
    aud:   ['h1_sh','h2_sh','h3_sh','h4_sh','h5_sh','h6_sh','h7_sh','h8_sh','h9_sh','h10_sh',
            'i1_sh','i2_sh','i3_sh','i4_sh','i5_sh','i6_sh','i7_sh','i8_sh','i9_sh','i10_sh'],
};
 
function randItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}
 
// Build stimulus sequence for each trial; records t1_pos and t2_pos (0-indexed).
export function makeSeq(trials, expt) {
    const distractors = DISTRACTORS[expt];
 
    return trials.map((trial, trialNum) => {
        const { t1, t2, lag } = trial;
        const seq = [];
 
        // Pre-T1 distractors (1–5)
        const numBefore = Math.floor(Math.random() * 5) + 1;
        for (let i = 0; i < numBefore; i++)
            seq.push({ stim: randItem(distractors), type: 'd' });
 
        const t1_pos = seq.length;
        seq.push({ stim: t1, type: 't1' });
 
        // Lag distractors
        for (let i = 0; i < lag; i++)
            seq.push({ stim: randItem(distractors), type: 'd' });
 
        const t2_pos = seq.length;
        seq.push({ stim: t2, type: 't2' });
 
        // Post-T2 distractors
        for (let i = 0; i < 3; i++)
            seq.push({ stim: randItem(distractors), type: 'd' });
 
        return { trialNum, t1, t2, lag, t1_pos, t2_pos, stimOrder: seq };
    });
}