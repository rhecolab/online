export function randomizeFull(t1_opts, t2_opts, lags, reps) {

    // full factoral randomization, where each t1 appears with each t2 at each lag 
    // t1_opts, t2_opts, lags are all lists; reps is a number [repeats within each t1xt2xlag combo]
    let trials = []

    // Get ever combo of t1, t2, lag and then repeat it
    for (let i = 0; i < lags.length; i++) {
        for (let j = 0; j < t1_opts.length; j++) {
            for (let k = 0; k < t2_opts.length; k++) {
                for (let r = 0; r < reps; r++) {
                    trials.push({
                        t1: t1_opts[j],
                        t2: t2_opts[k],
                        lag: lags[i]
                    });
                }
            }
        }
    }  


    // shuffle
    for (let i = trials.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [trials[i], trials[j]] = [trials[j], trials[i]];
    }

    // push out trial list 
    return trials;

}

export function makeSeq(trials, expt){
    // initialize
    let distractors = []
    let seqList = [];

    // pull distractor list for this experiment 
    switch(expt){
        case('shape'): 
            distractors = ['circle', 'square', 'triangle', 'pentagon']; 
            break;
        case('vis'): 
            distractors = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
            break;
        case('aud'): 
            distractors = ['h1_sh','h2_sh','h3_sh','h4_sh','h5_sh','h6_sh','h7_sh','h8_sh','h9_sh','h10_sh','i1_sh','i2_sh','i3_sh','i4_sh','i5_sh','i6_sh','i7_sh','i8_sh','i9_sh','i10_sh'];
            break;
    }

    // loop through trial list that specificies t1, t2, lag & construct stim seq for that trial 
    for (let i = 0; i < trials.length; i++)  {
    
        let seq = []

        const { t1, t2, lag } = trials[i];

    // pre t1: variable number of random distractors
        const numBeforeT1 = Math.floor(Math.random() * 5) + 1
        for (let i = 0; i < numBeforeT1; i++) {
            const stim = distractors[Math.floor(Math.random() * distractors.length)];
            seq.push({ stim, type: 'd' });
        }

    // t1
        seq.push({ stim: t1, type: 't1' });

    // lag trials: lag number of random distractors 
        for (let i = 0; i < lag; i++) {
            const stim = distractors[Math.floor(Math.random() * distractors.length)];
            seq.push({ stim, type: 'd' });
        }

    // t2
        seq.push({ stim: t2, type: 't2' });

    // post t2: add 3 distractors at the end
        for (let i = 0; i < 3; i++) {
            const stim = distractors[Math.floor(Math.random() * distractors.length)];
            seq.push({ stim, type: 'd' });
        }
    
    // Add to whole list 
    seqList.push({
        trialNum: i,
        t1,
        t2,
        lag,
        stimOrder: seq
    });

    }

    return seqList
}
