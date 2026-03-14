// Accordion functionality
document.addEventListener('DOMContentLoaded', function() {
    const headers = document.querySelectorAll('.accordion-header');

    headers.forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const isActive = this.classList.contains('active');

            // Close all accordions
            document.querySelectorAll('.accordion-header').forEach(h => {
                h.classList.remove('active');
                h.nextElementSibling.classList.remove('active');
            });

            // Open clicked if not already active
            if (!isActive) {
                this.classList.add('active');
                content.classList.add('active');
            }
        });
    });

    // Smooth scrolling for nav links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Add active class to nav on scroll
    window.addEventListener('scroll', function() {
        const sections = document.querySelectorAll('section');
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });

        document.querySelectorAll('nav a').forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === '#' + current) {
                link.classList.add('active');
            }
        });
    });

    // === DEMO TRACKING SYSTEM (Langkah 1-10 simulasi) ===
    let alumniData = [];
    const sources = ['Google', 'Scholar', 'LinkedIn', 'Company Site', 'ORCID'];

    // Load data alumni (Langkah 1)
    function loadAlumniData() {
        // Simulasi import dari data_alumni.js atau DB
        alumniData = [
            {
                id: 1,
                nama_lengkap: 'Muhammad Rizky',
                variasi_nama: ['Muhammad Rizky', 'M. Rizky', 'Rizky M.'],
                afiliasi: ['Universitas Muhammadiyah Malang', 'UMM', 'Informatika'],
                konteks: ['Informatika', '2020', 'Malang'],
                status: 'Belum Dilacak',
                last_update: null
            },
            {
                id: 2,
                nama_lengkap: 'Siti Nurhaliza',
                variasi_nama: ['Siti Nurhaliza', 'S. Nurhaliza'],
                afiliasi: ['UMM', 'Teknik Sipil'],
                konteks: ['Teknik Sipil', '2019', 'Malang'],
                status: 'Belum Dilacak',
                last_update: null
            }
        ];
        populateAlumniSelect();
    }

    // Populate select (Langkah 1)
    function populateAlumniSelect() {
        const select = document.getElementById('alumni-select');
        select.innerHTML = '<option value="">-- Pilih Alumni --</option>';
        alumniData.forEach(alumni => {
            const option = document.createElement('option');
            option.value = alumni.id;
            option.textContent = alumni.nama_lengkap + ' (' + alumni.konteks.join(', ') + ')';
            select.appendChild(option);
        });
    }

    // Generate queries (Langkah 4)
    function generateQueries(alumni) {
        const queries = [
            `"${alumni.nama_lengkap}" "Universitas Muhammadiyah Malang"`,
            `"${alumni.variasi_nama[1]}" ${alumni.afiliasi[1]} ${alumni.konteks[0]}`,
            `"${alumni.nama_lengkap}" site:scholar.google.com`,
            `"${alumni.nama_lengkap}" ORCID`,
            `"${alumni.nama_lengkap}" ${alumni.konteks[0]} ${alumni.konteks[2]}`
        ];
        return queries;
    }

    // Simulate search results (Langkah 5)
    function simulateSearch(queries) {
        // Simulasi hasil dari sumber (randomized for demo)
        const candidates = [];
        sources.forEach(source => {
            queries.forEach(query => {
                // 30% chance match, simulate signals
                if (Math.random() > 0.7) {
                    const matchScore = Math.random() * 100;
                    const signals = {
                        nama: Math.random() > 0.5 ? 'Partial match' : 'Exact',
                        afiliasi: Math.random() > 0.5 ? 'UMM found' : 'Other uni',
                        tahun: '2021-2023',
                        bidang: 'Informatika/Software',
                        jabatan: source === 'LinkedIn' ? 'Software Engineer' : 'Researcher',
                        lokasi: 'Malang/Jakarta'
                    };
                    candidates.push({
                        title: `${source} Result: ${query}`,
                        source: source,
                        signals: signals,
                        score: Math.min(95, 50 + matchScore),
                        link: `https://${source.toLowerCase()}.com/result-${Math.random().toString(36).substr(2, 5)}`
                    });
                }
            });
        });
        return candidates.slice(0, 8); // Max 8 candidates
    }

    // Extract signals & disambiguasi score (Langkah 6-7)
    function calculateScore(alumni, candidate) {
        let score = 0;
        // Nama match
        if (alumni.variasi_nama.some(v => candidate.signals.nama.includes(v) || candidate.signals.nama === 'Exact')) score += 30;
        // Afiliasi
        if (candidate.signals.afiliasi === 'UMM found') score += 25;
        // Timeline (simple)
        if (parseInt(candidate.signals.tahun) >= parseInt(alumni.konteks[1]) - 1) score += 20;
        // Bidang
        if (candidate.signals.bidang.includes(alumni.konteks[0].toLowerCase())) score += 20;
        // Lokasi
        if (candidate.signals.lokasi.includes(alumni.konteks[2])) score += 5;
        return score;
    }

    // Set status based on best candidate (Langkah 8)
    function getStatus(score) {
        if (score >= 80) return { text: 'Kemungkinan Kuat ✅', class: 'status-kuat' };
        if (score >= 50) return { text: 'Perlu Verifikasi ⚠️', class: 'status-verif' };
        return { text: 'Tidak Cocok ❌', class: 'status-tidak' };
    }

    // Cross-validation (Langkah 9) - simple multi-source boost
    function crossValidate(candidates) {
        const sourceCount = {};
        candidates.forEach(c => {
            sourceCount[c.source] = (sourceCount[c.source] || 0) + 1;
        });
        const maxSources = Math.max(...Object.values(sourceCount));
        if (maxSources >= 2) {
            // Boost top candidates if multi-source
            candidates.forEach(c => {
                if (sourceCount[c.source] >= 2) c.score += 10;
            });
        }
        return candidates.sort((a, b) => b.score - a.score);
    }

    // Save trail (Langkah 10)
    function saveTrackingTrail(alumniId, results) {
        const trail = {
            timestamp: new Date().toISOString(),
            alumniId: alumniId,
            results: results,
            confidence: Math.max(...results.map(r => r.score))
        };
        localStorage.setItem(`tracking_${alumniId}`, JSON.stringify(trail));
        console.log('Jejak bukti disimpan:', trail);
    }

    // Main track function (Langkah 3 run job)
    document.getElementById('track-btn').addEventListener('click', function() {
        const alumniId = parseInt(document.getElementById('alumni-select').value);
        if (!alumniId) {
            alert('Pilih alumni dulu!');
            return;
        }

        const alumni = alumniData.find(a => a.id === alumniId);
        const btn = this;
        const resultsSection = document.getElementById('results');
        const queriesEl = document.getElementById('queries');
        const summaryEl = document.getElementById('summary');
        const tbody = document.querySelector('#results-table tbody');

        // Loading
        btn.textContent = 'Tracking... ⏳';
        btn.disabled = true;
        resultsSection.innerHTML = '<div class="loading">Menjalankan pencarian dari multiple sources...</div>';
        queriesEl.innerHTML = '';

        setTimeout(() => {
            // Langkah 4: Generate queries
            const queries = generateQueries(alumni);
            queriesEl.innerHTML = '<h4>Queries Digenerate (Langkah 4):</h4><pre>' + queries.join('\n') + '</pre>';

            // Langkah 5: Simulate search
            const candidates = simulateSearch(queries);

            // Langkah 6-7: Extract & score
            candidates.forEach(c => {
                c.finalScore = calculateScore(alumni, c);
                c.status = getStatus(c.finalScore);
            });

            // Langkah 9: Cross-validate
            const sortedCandidates = crossValidate(candidates);

            // Langkah 8: Render results + status
            tbody.innerHTML = '';
            sortedCandidates.forEach(c => {
                const row = tbody.insertRow();
                row.innerHTML = `
                    <td><a href="${c.link}" target="_blank">${c.title}</a></td>
                    <td>${Object.entries(c.signals).map(([k,v]) => `${k}: ${v}`).join('<br>')}</td>
                    <td>${c.finalScore.toFixed(0)}%</td>
                    <td><span class="${c.status.class}">${c.status.text}</span></td>
                    <td>${c.source}</td>
                `;
            });

            // Update alumni status
            const bestScore = sortedCandidates[0]?.finalScore || 0;
            alumni.status = getStatus(bestScore).text;
            alumni.last_update = new Date().toISOString();

            // Langkah 10: Save trail
            saveTrackingTrail(alumniId, sortedCandidates);

            // Summary
            const bestCandidate = sortedCandidates[0];
            summaryEl.innerHTML = `
                <h3>Status Alumni: ${alumni.status}</h3>
                ${bestCandidate ? `<p>Best match: ${bestCandidate.title} (Score: ${bestCandidate.finalScore.toFixed(0)}%)</p>` : '<p>Tidak ada kandidat relevan.</p>'}
                <small>Cross-validated dari ${sources.length} sumber. Riwayat disimpan.</small>
            `;

            btn.textContent = '✅ Tracking Selesai';
            setTimeout(() => {
                btn.textContent = '🚀 Jalankan Pelacakan (Langkah 3-10)';
                btn.disabled = false;
            }, 2000);

        }, 2000); // Simulate delay
    });

    // Init
    loadAlumniData();
});

