--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'PRESENT',
    'ABSENT',
    'EXCUSED',
    'LATE'
);


ALTER TYPE public."AttendanceStatus" OWNER TO postgres;

--
-- Name: FeePeriod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FeePeriod" AS ENUM (
    'MONTHLY',
    'QUARTERLY',
    'YEARLY',
    'ONE_TIME',
    'SEMI_ANNUAL'
);


ALTER TYPE public."FeePeriod" OWNER TO postgres;

--
-- Name: NoteType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NoteType" AS ENUM (
    'GENERAL',
    'HEALTH',
    'BEHAVIOR',
    'PAYMENT',
    'ACADEMIC'
);


ALTER TYPE public."NoteType" OWNER TO postgres;

--
-- Name: NotificationMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationMethod" AS ENUM (
    'EMAIL',
    'SMS',
    'IN_APP'
);


ALTER TYPE public."NotificationMethod" OWNER TO postgres;

--
-- Name: NotificationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationStatus" AS ENUM (
    'PENDING',
    'SENT',
    'FAILED',
    'CANCELLED'
);


ALTER TYPE public."NotificationStatus" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'PAYMENT_REMINDER',
    'PAYMENT_OVERDUE',
    'ATTENDANCE_REMINDER',
    'GENERAL_ANNOUNCEMENT',
    'TRAINING_CANCELLED'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: PaymentMethod; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentMethod" AS ENUM (
    'CASH',
    'BANK_TRANSFER',
    'CREDIT_CARD',
    'CHEQUE'
);


ALTER TYPE public."PaymentMethod" OWNER TO postgres;

--
-- Name: PaymentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PaymentStatus" AS ENUM (
    'PENDING',
    'PARTIAL',
    'PAID',
    'OVERDUE',
    'CANCELLED'
);


ALTER TYPE public."PaymentStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'ACCOUNTING',
    'TRAINER',
    'SECRETARY'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _StudentParents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_StudentParents" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


ALTER TABLE public."_StudentParents" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: attendances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendances (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "sessionId" text NOT NULL,
    status public."AttendanceStatus" DEFAULT 'PRESENT'::public."AttendanceStatus" NOT NULL,
    notes text,
    "excuseReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL
);


ALTER TABLE public.attendances OWNER TO postgres;

--
-- Name: fee_types; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fee_types (
    id text NOT NULL,
    name text NOT NULL,
    amount double precision NOT NULL,
    period public."FeePeriod" DEFAULT 'MONTHLY'::public."FeePeriod" NOT NULL,
    "groupId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.fee_types OWNER TO postgres;

--
-- Name: group_histories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.group_histories (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "groupId" text NOT NULL,
    "startDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "endDate" timestamp(3) without time zone,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.group_histories OWNER TO postgres;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.groups (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "coachId" text,
    "assistantCoachId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.groups OWNER TO postgres;

--
-- Name: notes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notes (
    id text NOT NULL,
    "studentId" text NOT NULL,
    title text NOT NULL,
    content text NOT NULL,
    type public."NoteType" DEFAULT 'GENERAL'::public."NoteType" NOT NULL,
    "isPinned" boolean DEFAULT false NOT NULL,
    "isImportant" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL
);


ALTER TABLE public.notes OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    "studentId" text,
    title text NOT NULL,
    message text NOT NULL,
    type public."NotificationType" NOT NULL,
    method public."NotificationMethod" NOT NULL,
    status public."NotificationStatus" DEFAULT 'PENDING'::public."NotificationStatus" NOT NULL,
    "scheduledAt" timestamp(3) without time zone,
    "sentAt" timestamp(3) without time zone,
    "recipientEmail" text,
    "recipientPhone" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: parents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.parents (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text NOT NULL,
    email text,
    address text,
    relationship text NOT NULL,
    "isEmergency" boolean DEFAULT false NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.parents OWNER TO postgres;

--
-- Name: payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payments (
    id text NOT NULL,
    "studentId" text NOT NULL,
    "feeTypeId" text NOT NULL,
    amount double precision NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    "paidDate" timestamp(3) without time zone,
    "paidAmount" double precision,
    "paymentMethod" public."PaymentMethod",
    status public."PaymentStatus" DEFAULT 'PENDING'::public."PaymentStatus" NOT NULL,
    "referenceNumber" text,
    notes text,
    "receiptUrl" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL
);


ALTER TABLE public.payments OWNER TO postgres;

--
-- Name: students; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.students (
    id text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    phone text,
    "birthDate" timestamp(3) without time zone,
    "groupId" text,
    "isActive" boolean DEFAULT true NOT NULL,
    "enrollmentDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text NOT NULL
);


ALTER TABLE public.students OWNER TO postgres;

--
-- Name: trainers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trainers (
    id text NOT NULL,
    name text NOT NULL,
    "position" text NOT NULL,
    experience integer NOT NULL,
    license text,
    photo text,
    biography text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.trainers OWNER TO postgres;

--
-- Name: training_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.training_sessions (
    id text NOT NULL,
    "trainingId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "startTime" timestamp(3) without time zone NOT NULL,
    "endTime" timestamp(3) without time zone NOT NULL,
    location text,
    notes text,
    "isCancelled" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.training_sessions OWNER TO postgres;

--
-- Name: trainings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.trainings (
    id text NOT NULL,
    "groupId" text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.trainings OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    phone text,
    role public."UserRole" DEFAULT 'SECRETARY'::public."UserRole" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "trainerId" text
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: _StudentParents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."_StudentParents" ("A", "B") FROM stdin;
cmhdb44750005r1t4xtc0eaow	cmhdb44790007r1t44uygdrl8
cmhdb447k0008r1t41748421n	cmhdb447m000ar1t4oq4jfvy9
cmhdb447q000br1t44e47anqz	cmhdb447s000dr1t4ch03fjjh
cmhdb447x000er1t49b1uere9	cmhdb447z000gr1t4oev9cqoj
cmhdb4483000hr1t4hc42lk8o	cmhdb4485000jr1t47v0b7l5d
cmhdb448a000kr1t482i2vwky	cmhdb448c000mr1t405jsjzin
cmhdb448h000nr1t4zxewyt7o	cmhdb448j000pr1t4fy1c1isw
cmhdb448o000qr1t4m5ujtv3d	cmhdb448q000sr1t48rq4fxwx
cmhdb448w000tr1t47dagzq09	cmhdb448y000vr1t4uw2yqway
cmhdb4492000wr1t4n39i3c2m	cmhdb4494000yr1t4qufjpmb5
cmhdb4499000zr1t4u3819q10	cmhdb449b0011r1t42olumgwe
cmhdb449f0012r1t4rhf3346o	cmhdb449i0014r1t4w01bjq1n
cmhdb449m0015r1t4m4lwm068	cmhdb449o0017r1t43x45j7s1
cmhdb449s0018r1t4dx2d04e0	cmhdb449u001ar1t4qkumcyr4
cmhdb449y001br1t4gsw2kgvg	cmhdb44a0001dr1t464b6jfpl
cmhdb44a4001er1t4g0iaik0p	cmhdb44a6001gr1t45nm1ffw5
cmhdb44ab001hr1t4yy9picod	cmhdb44ad001jr1t4wppt5s84
cmhdb44ah001kr1t41txls8sb	cmhdb44ai001mr1t4dujla972
cmhdb44an001nr1t4ao8eaw2p	cmhdb44ap001pr1t454nizq6a
cmhdb44at001qr1t4h6roja42	cmhdb44av001sr1t4c6jkzm71
cmhdb44az001tr1t4i0wpsa40	cmhdb44b1001vr1t45svlqmik
cmhdb44b6001wr1t46jmyivdg	cmhdb44b9001yr1t470an1pqm
cmhdb44be001zr1t4xbml6vyw	cmhdb44bg0021r1t4gwymz6j0
cmhdb44bl0022r1t4gm9n19rb	cmhdb44bn0024r1t4sfc4zx0b
cmhdb44br0025r1t4ode2srek	cmhdb44bt0027r1t4yj2fcxc6
cmhdb44bx0028r1t4vup5wxz8	cmhdb44bz002ar1t4mal9fmn9
cmhdb44c4002br1t4ainbenn4	cmhdb44c5002dr1t4r7fwptmc
cmhdb44c9002er1t4x4k7d1qc	cmhdb44cb002gr1t4cs48p26i
cmhdb44cf002hr1t4nc7fp8uk	cmhdb44ci002jr1t4yinlv2xk
cmhdb44cm002kr1t44i8queob	cmhdb44co002mr1t41c383shu
cmhdb44cs002nr1t4ot23if78	cmhdb44cu002pr1t4k0tecvjv
cmhdb44cz002qr1t4e3b9t93e	cmhdb44d1002sr1t4siqaos13
cmhdb44d5002tr1t47yald4qe	cmhdb44d7002vr1t4bo1oru3x
cmhdb44da002wr1t4s3eut01t	cmhdb44dd002yr1t4olftfbwb
cmhdb44di002zr1t4dkvg90cl	cmhdb44dj0031r1t4zl4vbwo0
cmhdb44dn0032r1t45horhc5e	cmhdb44dp0034r1t4epvjtorf
cmhdb44dt0035r1t4an8xb4z3	cmhdb44dw0037r1t4qiec9kyx
cmhdb44e00038r1t4sze7ifko	cmhdb44e2003ar1t4ftyb614q
cmhdb44e6003br1t4wp0aos27	cmhdb44e8003dr1t4hlnotlkx
cmhdb44ec003er1t41olw2ogs	cmhdb44ee003gr1t4cx22hn6n
cmhdb44ej003hr1t428upa7ni	cmhdb44el003jr1t4319vpqqd
cmhdb44ep003kr1t4ki69ph6k	cmhdb44er003mr1t45k7m1u79
cmhdb44ex003nr1t4srdnxmop	cmhdb44ez003pr1t4rgc1vv2i
cmhdb44f3003qr1t4nz35bpsh	cmhdb44f5003sr1t4my06vaw0
cmhdb44fa003tr1t4293rnqux	cmhdb44fd003vr1t4ac6p4bxo
cmhdb44fh003wr1t48c01y9gr	cmhdb44fj003yr1t42usw2nqf
cmhdb44fo003zr1t4kgcuwep1	cmhdb44fq0041r1t4qjm6go6y
cmhdb44fv0042r1t4uie1ru0s	cmhdb44fy0044r1t4bece1zsc
cmhdb44g20045r1t4s7wfo7q9	cmhdb44g40047r1t4pek7rcbo
cmhdb44g90048r1t4mlg9tanf	cmhdb44gb004ar1t4dm4odllm
cmhdb44gf004br1t4qeme8evy	cmhdb44gh004dr1t48b9sho12
cmhdb44gl004er1t4m0hwvy85	cmhdb44go004gr1t4t7byvy36
cmhdb44gt004hr1t4q7lo2css	cmhdb44gu004jr1t4zn3bq4oa
cmhdb44gz004kr1t4vlur7j0b	cmhdb44h0004mr1t4xojkbgph
cmhdb44h5004nr1t4mvgc7csq	cmhdb44h7004pr1t4ypsfsagn
cmhdb44hb004qr1t420va753f	cmhdb44hd004sr1t4ptma7ckw
cmhdb44hh004tr1t4326wqvna	cmhdb44hj004vr1t4poa3trgn
cmhdb44hp004wr1t4yel8xpwn	cmhdb44hr004yr1t4rumvjhox
cmhdb44hv004zr1t4tux31v2g	cmhdb44hw0051r1t46ubnnjgu
cmhdb44i10052r1t4f1u3pf8h	cmhdb44i40054r1t44ph99dyy
cmhdb44ia0055r1t41ui10jjw	cmhdb44ic0057r1t4dhmlwpd8
cmhdb44ik0058r1t4ruetkp8k	cmhdb44in005ar1t46xheeiw3
cmhdb44it005br1t4l625lwl1	cmhdb44ix005dr1t4l1lkla3p
cmhdb44je005hr1t4dyxoxbta	cmhdb44jg005jr1t4xhj8jp2q
cmhdb44jm005kr1t4e2nc32qz	cmhdb44jo005mr1t48j0tu2kh
cmhdb44js005nr1t43n1w26xj	cmhdb44ju005pr1t4lvbhepmh
cmhdb44k0005qr1t41tym7dfl	cmhdb44k2005sr1t4ua1p1g84
cmhdb44k6005tr1t484mhr6e8	cmhdb44k8005vr1t4vz83shgq
cmhdb44kd005wr1t45wp6444w	cmhdb44kg005yr1t4y4xdpi3d
cmhdb44kk005zr1t4mrps18zw	cmhdb44km0061r1t4q0zrzyms
cmhdb44kq0062r1t4v5voahbn	cmhdb44ks0064r1t4mlg7iiby
cmhdb44kx0065r1t439mjgmr9	cmhdb44kz0067r1t417omj02f
cmhdb44l30068r1t4a2uwqh66	cmhdb44l4006ar1t4sxznl6ce
cmhdb44la006br1t4ejucz5mu	cmhdb44lc006dr1t4rk8avu78
cmhdb44lh006er1t443xn9ib3	cmhdb44li006gr1t4p95uc4kl
cmhdb44ln006hr1t45n6wnx6f	cmhdb44lp006jr1t4nfjyuuyl
cmhdb44lu006kr1t49rrmn411	cmhdb44lv006mr1t445aypf4y
cmhdb44m0006nr1t4f1ke8f37	cmhdb44m1006pr1t4wegzobhf
cmhdb44m6006qr1t49ws26prh	cmhdb44m8006sr1t42vqcgtto
cmhdb44md006tr1t4vje52ujv	cmhdb44me006vr1t4nkfgj3uv
cmhdb44mi006wr1t4dljbez3a	cmhdb44mk006yr1t4odp8lujb
cmhdb44mp006zr1t4igp6zh19	cmhdb44mr0071r1t4xgndq830
cmhdb44mx0072r1t4buzur11j	cmhdb44mz0074r1t44ttsmijz
cmhdb44n30075r1t4aqfl9wvn	cmhdb44n50077r1t4w2exedss
cmhdb44na0078r1t4562i29ar	cmhdb44nc007ar1t4g0gn9ggj
cmhdb44ng007br1t4p26fhr8a	cmhdb44ni007dr1t47ee4kfo9
cmhdb44nn007er1t4fn9159oi	cmhdb44np007gr1t42i6x5q2h
cmhdb44nu007hr1t4rhhvub5j	cmhdb44nw007jr1t4lha5cyhn
cmhdb44o0007kr1t4tho46ufv	cmhdb44o3007mr1t4g7802zju
cmhdb44o8007nr1t43tfof4ov	cmhdb44oa007pr1t4dol1i6sb
cmhdb44or007wr1t4vcma76p2	cmhdb44ot007yr1t4ruargwst
cmhdb44p50082r1t4dzh7tvgz	cmhdb44p70084r1t4vre2k1sq
cmhdb44pb0085r1t490nbrsst	cmhdb44pd0087r1t4ixvk0iy5
cmhdb44pi0088r1t429u7mfj4	cmhdb44pk008ar1t40urxukj3
cmhdb44po008br1t43pypzjm1	cmhdb44pq008dr1t4cndvhnfs
cmhdb44pt008er1t44unc27vd	cmhdb44pv008gr1t4a5ho33e6
cmhdb44q1008hr1t4nzjhtihf	cmhdb44q3008jr1t4luc0z5vz
cmhdb44q7008kr1t4wdcao6pf	cmhdb44q9008mr1t499jppsd9
cmhdb44ql008qr1t48aayam5i	cmhdb44qm008sr1t4xqpwapxj
cmhdb44qq008tr1t4mi6f7lj8	cmhdb44qs008vr1t43pup845y
cmhdb44qx008wr1t4395rrntg	cmhdb44qz008yr1t48zmzoy2o
cmhdb44r3008zr1t4i2u9w9xg	cmhdb44r50091r1t4roeje66b
cmhdb44r90092r1t443rtzfmg	cmhdb44rb0094r1t4b3ex5lk0
cmhdb44rg0095r1t4hyxri1lj	cmhdb44ri0097r1t4cmve5yq6
cmhdb44rm0098r1t4av5zp62a	cmhdb44ro009ar1t4yomqamm5
cmhdd07d40005r1ng5vlxjyak	cmhdb44qg008pr1t4fa3acvp1
cmhde43r20002r12cn9scwy8w	cmhdb44on007vr1t4munhk9ws
cmhdevnq30000r1jwmelwu3ys	cmhdb44og007sr1t4n9u6r2b8
cmhdewpvz0001r1jw4cxef90d	cmhdb44p00081r1t4pcbiwdzi
cmhdftwak0000r1bche8tmtfz	cmhdb44j8005gr1t4144a41vc
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
724cc1ea-7a15-4eb4-901c-ba45337d427b	8f420cf9896fee495e6056135a995138b3610dacde7480c328a7b1817cc3f972	2025-10-30 10:21:59.234068+00	20251030102158_add_coach_to_groups	\N	\N	2025-10-30 10:21:58.96567+00	1
109b5209-d7a3-440e-8d44-3e96fd571d4d	1ce2b3e6f42c0f45c46c12372148bdd72b307a2b9cb275d92e87eb2dcd4a8c7a	2025-10-30 11:57:39.167816+00	20251030115739_add_semi_annual_fee_period	\N	\N	2025-10-30 11:57:39.161295+00	1
a54ca6d1-c9e6-41e7-a8dc-d39bdd853986	608335307a245add6452efc875a0e6a99f069a39bf148582b874723248b553ec	2025-11-04 07:54:13.763158+00	20251104075413_add_user_trainer_relation	\N	\N	2025-11-04 07:54:13.748966+00	1
\.


--
-- Data for Name: attendances; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.attendances (id, "studentId", "sessionId", status, notes, "excuseReason", "createdAt", "updatedAt", "createdById") FROM stdin;
cmhk8h6cq001zqj0141fhqkwn	cmhdb448j000pr1t4fy1c1isw	cmhk8g8cl001lqj01jeht9va5	PRESENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6cr0021qj01extu34v5	cmhdb448y000vr1t4uw2yqway	cmhk8g8cl001lqj01jeht9va5	PRESENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6cr0023qj01xt9t1ade	cmhdb44og007sr1t4n9u6r2b8	cmhk8g8cl001lqj01jeht9va5	PRESENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6cs0025qj01r7kvifwx	cmhdb4494000yr1t4qufjpmb5	cmhk8g8cl001lqj01jeht9va5	PRESENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6ct0027qj01v73ce35a	cmhdb448c000mr1t405jsjzin	cmhk8g8cl001lqj01jeht9va5	PRESENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6ct0029qj01pfbysab1	cmhdb4485000jr1t47v0b7l5d	cmhk8g8cl001lqj01jeht9va5	PRESENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6cu002bqj01bnoyshkl	cmhdb447s000dr1t4ch03fjjh	cmhk8g8cl001lqj01jeht9va5	PRESENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6cn001nqj01b49apq0g	cmhdb44j8005gr1t4144a41vc	cmhk8g8cl001lqj01jeht9va5	ABSENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6co001pqj01gyv6x9el	cmhdb44on007vr1t4munhk9ws	cmhk8g8cl001lqj01jeht9va5	ABSENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6co001rqj01kxyxkns0	cmhdb447z000gr1t4oev9cqoj	cmhk8g8cl001lqj01jeht9va5	PRESENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6cp001tqj01rkb2ko8i	cmhdb447m000ar1t4oq4jfvy9	cmhk8g8cl001lqj01jeht9va5	PRESENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6cp001vqj01h6kza2u1	cmhdb448q000sr1t48rq4fxwx	cmhk8g8cl001lqj01jeht9va5	PRESENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
cmhk8h6cq001xqj01fh81t9wm	cmhdb44790007r1t44uygdrl8	cmhk8g8cl001lqj01jeht9va5	PRESENT			2025-11-04 07:14:31.655	2025-11-04 07:14:31.655	cmhd9znsp0000r1v4xcv3034p
\.


--
-- Data for Name: fee_types; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fee_types (id, name, amount, period, "groupId", "isActive", "createdAt", "updatedAt") FROM stdin;
cmhddn5um0001r12cv6p5nh86	Yarı Dönem	9000	SEMI_ANNUAL	\N	t	2025-10-30 12:04:45.791	2025-10-30 12:04:56.712
cmhd9zntt0006r1v4f0t1yx4r	Aylık	1500	MONTHLY	\N	t	2025-10-30 10:22:30.497	2025-10-30 12:05:13.481
cmhd9znu20008r1v467unx7i6	Dönem	4500	QUARTERLY	\N	t	2025-10-30 10:22:30.507	2025-10-30 12:05:21.531
cmhdday4v0007r1ngm8ch3in1	Yıllık	18000	YEARLY	\N	t	2025-10-30 11:55:15.918	2025-10-30 12:05:35.295
cmheinn310003r1estju9c9r5	Kardeş İndirimi	1450	MONTHLY	\N	t	2025-10-31 07:12:52.381	2025-10-31 07:12:52.381
cmhd9zntz0007r1v4twgfu8cd	Free	1	YEARLY	\N	t	2025-10-30 10:22:30.503	2025-10-31 07:13:20.419
\.


--
-- Data for Name: group_histories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.group_histories (id, "studentId", "groupId", "startDate", "endDate", reason, "createdAt") FROM stdin;
\.


--
-- Data for Name: groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.groups (id, name, description, "coachId", "assistantCoachId", "isActive", "createdAt", "updatedAt") FROM stdin;
cmhd9znt70002r1v46mrowpnl	FO-A2	10 yaş altı futbol grubu	cmhda4xpa0001r1n4wj5v8nv7	cmhda4xpf0002r1n4s6nhkt6s	t	2025-10-30 10:22:30.475	2025-10-30 10:43:22.908
cmhd9zntc0003r1v4bn7a8y52	FO-B1	12 yaş altı futbol grubu	cmhda4xp40000r1n48xeixqbl	cmhda4xpj0003r1n4vrg7ac54	t	2025-10-30 10:22:30.48	2025-10-30 10:43:51.107
cmhd9zntm0005r1v4i1pt5mx1	FO-B2	12 yaş altı futbol grubu	cmhda4xpj0003r1n4vrg7ac54	cmhda4xpa0001r1n4wj5v8nv7	t	2025-10-30 10:22:30.49	2025-10-30 10:44:21.79
cmhdb0qy50001r14k4ftgb16s	FO-C1	14 yaş altı futbol grubu	cmhda4xpf0002r1n4s6nhkt6s	cmhda4xpj0003r1n4vrg7ac54	t	2025-10-30 10:51:20.812	2025-10-30 10:51:20.812
cmhdb10s00003r14k063dfdts	FO-C2	14 yaş altı futbol grubu	cmhda4xp40000r1n48xeixqbl	cmhda4xpf0002r1n4s6nhkt6s	t	2025-10-30 10:51:33.552	2025-10-30 10:51:33.552
cmhdb446m0003r1t40xt7u0y1	Başlangıç	Başlangıç seviyesi futbol grubu	cmhda4xp40000r1n48xeixqbl	cmhda4xpj0003r1n4vrg7ac54	t	2025-10-30 10:53:57.935	2025-10-30 13:21:16.231
cmhd9znt00001r1v4797lj4ps	FO-A1	10 yaş altı futbol grubu	cmhda4xp40000r1n48xeixqbl	cmhda4xpf0002r1n4s6nhkt6s	t	2025-10-30 10:22:30.468	2025-10-30 13:21:19.632
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notes (id, "studentId", title, content, type, "isPinned", "isImportant", "createdAt", "updatedAt", "createdById") FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, "studentId", title, message, type, method, status, "scheduledAt", "sentAt", "recipientEmail", "recipientPhone", "createdAt", "updatedAt", "createdById") FROM stdin;
\.


--
-- Data for Name: parents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.parents (id, "firstName", "lastName", phone, email, address, relationship, "isEmergency", "isPrimary", "createdAt", "updatedAt") FROM stdin;
cmhdb44750005r1t4xtc0eaow	Ayşe	Demir	+90 5110197562	ali.demir@example.com	\N	anne	f	t	2025-10-30 10:53:57.953	2025-10-30 10:53:57.953
cmhdb447k0008r1t41748421n	Fatma	Aydın	+90 5702547310	burak.aydın@example.com	\N	anne	f	t	2025-10-30 10:53:57.968	2025-10-30 10:53:57.968
cmhdb447q000br1t44e47anqz	Fatma	Öztürk	+90 5547198228	kerem.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:57.974	2025-10-30 10:53:57.974
cmhdb447x000er1t49b1uere9	Fatma	Aydın	+90 5489663974	berk.aydın@example.com	\N	anne	f	t	2025-10-30 10:53:57.982	2025-10-30 10:53:57.982
cmhdb4483000hr1t4hc42lk8o	Fatma	Öztürk	+90 5565111415	furkan.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:57.988	2025-10-30 10:53:57.988
cmhdb448a000kr1t482i2vwky	Fatma	Özdemir	+90 5747475947	ahmet.özdemir@example.com	\N	anne	f	t	2025-10-30 10:53:57.994	2025-10-30 10:53:57.994
cmhdb448h000nr1t4zxewyt7o	Fatma	Doğan	+90 5211593955	emre.doğan@example.com	\N	anne	f	t	2025-10-30 10:53:58.002	2025-10-30 10:53:58.002
cmhdb448o000qr1t4m5ujtv3d	Fatma	Demir	+90 5906818861	ahmet.demir@example.com	\N	anne	f	t	2025-10-30 10:53:58.009	2025-10-30 10:53:58.009
cmhdb448w000tr1t47dagzq09	Fatma	Karaağaç	+90 5240456413	berk.karaağaç@example.com	\N	anne	f	t	2025-10-30 10:53:58.017	2025-10-30 10:53:58.017
cmhdb4492000wr1t4n39i3c2m	Fatma	Karaağaç	+90 5805585987	mehmet.karaağaç@example.com	\N	anne	f	t	2025-10-30 10:53:58.022	2025-10-30 10:53:58.022
cmhdb4499000zr1t4u3819q10	Fatma	Yılmaz	+90 5557924832	mustafa.yılmaz@example.com	\N	anne	f	t	2025-10-30 10:53:58.029	2025-10-30 10:53:58.029
cmhdb449f0012r1t4rhf3346o	Fatma	Doğan	+90 5432589626	cem.doğan@example.com	\N	anne	f	t	2025-10-30 10:53:58.036	2025-10-30 10:53:58.036
cmhdb449m0015r1t4m4lwm068	Fatma	Arslan	+90 5506928498	mustafa.arslan@example.com	\N	anne	f	t	2025-10-30 10:53:58.042	2025-10-30 10:53:58.042
cmhdb449s0018r1t4dx2d04e0	Fatma	Çelik	+90 5516873685	ahmet.çelik@example.com	\N	anne	f	t	2025-10-30 10:53:58.049	2025-10-30 10:53:58.049
cmhdb449y001br1t4gsw2kgvg	Ayşe	Şahin	+90 5115706833	ali.şahin@example.com	\N	anne	f	t	2025-10-30 10:53:58.055	2025-10-30 10:53:58.055
cmhdb44a4001er1t4g0iaik0p	Fatma	Şahin	+90 5398288552	deniz.şahin@example.com	\N	anne	f	t	2025-10-30 10:53:58.06	2025-10-30 10:53:58.06
cmhdb44ab001hr1t4yy9picod	Fatma	Aydın	+90 5925520457	ahmet.aydın@example.com	\N	anne	f	t	2025-10-30 10:53:58.067	2025-10-30 10:53:58.067
cmhdb44ah001kr1t41txls8sb	Fatma	Yıldız	+90 5620149195	mehmet.yıldız@example.com	\N	anne	f	t	2025-10-30 10:53:58.073	2025-10-30 10:53:58.073
cmhdb44an001nr1t4ao8eaw2p	Fatma	Aslan	+90 5228454001	mert.aslan@example.com	\N	anne	f	t	2025-10-30 10:53:58.079	2025-10-30 10:53:58.079
cmhdb44at001qr1t4h6roja42	Fatma	Yıldırım	+90 5848908118	ahmet.yıldırım@example.com	\N	anne	f	t	2025-10-30 10:53:58.086	2025-10-30 10:53:58.086
cmhdb44az001tr1t4i0wpsa40	Fatma	Aslan	+90 5263824266	mustafa.aslan@example.com	\N	anne	f	t	2025-10-30 10:53:58.092	2025-10-30 10:53:58.092
cmhdb44b6001wr1t46jmyivdg	Fatma	Aslan	+90 5300926619	mehmet.aslan@example.com	\N	anne	f	t	2025-10-30 10:53:58.099	2025-10-30 10:53:58.099
cmhdb44be001zr1t4xbml6vyw	Fatma	Demir	+90 5910262611	mehmet.demir@example.com	\N	anne	f	t	2025-10-30 10:53:58.106	2025-10-30 10:53:58.106
cmhdb44bl0022r1t4gm9n19rb	Fatma	Aslan	+90 5695866248	kerem.aslan@example.com	\N	anne	f	t	2025-10-30 10:53:58.113	2025-10-30 10:53:58.113
cmhdb44br0025r1t4ode2srek	Fatma	Yıldız	+90 5852818999	mehmet.yıldız@example.com	\N	anne	f	t	2025-10-30 10:53:58.12	2025-10-30 10:53:58.12
cmhdb44bx0028r1t4vup5wxz8	Fatma	Çelik	+90 5838137826	deniz.çelik@example.com	\N	anne	f	t	2025-10-30 10:53:58.125	2025-10-30 10:53:58.125
cmhdb44c4002br1t4ainbenn4	Fatma	Yıldız	+90 5247453361	berk.yıldız@example.com	\N	anne	f	t	2025-10-30 10:53:58.132	2025-10-30 10:53:58.132
cmhdb44c9002er1t4x4k7d1qc	Fatma	Doğan	+90 5756948112	can.doğan@example.com	\N	anne	f	t	2025-10-30 10:53:58.138	2025-10-30 10:53:58.138
cmhdb44cf002hr1t4nc7fp8uk	Fatma	Yılmaz	+90 5794952331	kaan.yılmaz@example.com	\N	anne	f	t	2025-10-30 10:53:58.143	2025-10-30 10:53:58.143
cmhdb44cm002kr1t44i8queob	Fatma	Aslan	+90 5725350191	cem.aslan@example.com	\N	anne	f	t	2025-10-30 10:53:58.151	2025-10-30 10:53:58.151
cmhdb44cs002nr1t4ot23if78	Fatma	Polat	+90 5587995234	mehmet.polat@example.com	\N	anne	f	t	2025-10-30 10:53:58.156	2025-10-30 10:53:58.156
cmhdb44cz002qr1t4e3b9t93e	Fatma	Yılmaz	+90 5435935956	can.yılmaz@example.com	\N	anne	f	t	2025-10-30 10:53:58.163	2025-10-30 10:53:58.163
cmhdb44d5002tr1t47yald4qe	Fatma	Demir	+90 5639908216	mert.demir@example.com	\N	anne	f	t	2025-10-30 10:53:58.169	2025-10-30 10:53:58.169
cmhdb44da002wr1t4s3eut01t	Fatma	Özdemir	+90 5453248947	mehmet.özdemir@example.com	\N	anne	f	t	2025-10-30 10:53:58.175	2025-10-30 10:53:58.175
cmhdb44di002zr1t4dkvg90cl	Fatma	Özdemir	+90 5114168370	cem.özdemir@example.com	\N	anne	f	t	2025-10-30 10:53:58.182	2025-10-30 10:53:58.182
cmhdb44dn0032r1t45horhc5e	Fatma	Aydın	+90 5854401275	deniz.aydın@example.com	\N	anne	f	t	2025-10-30 10:53:58.188	2025-10-30 10:53:58.188
cmhdb44dt0035r1t4an8xb4z3	Fatma	Öztürk	+90 5140973519	kerem.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:58.194	2025-10-30 10:53:58.194
cmhdb44e00038r1t4sze7ifko	Fatma	Öztürk	+90 5392976006	cem.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:58.201	2025-10-30 10:53:58.201
cmhdb44e6003br1t4wp0aos27	Fatma	Çelik	+90 5725782254	can.çelik@example.com	\N	anne	f	t	2025-10-30 10:53:58.206	2025-10-30 10:53:58.206
cmhdb44ec003er1t41olw2ogs	Fatma	Arslan	+90 5598074699	kerem.arslan@example.com	\N	anne	f	t	2025-10-30 10:53:58.213	2025-10-30 10:53:58.213
cmhdb44ej003hr1t428upa7ni	Ayşe	Öztürk	+90 5145297836	ali.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:58.219	2025-10-30 10:53:58.219
cmhdb44ep003kr1t4ki69ph6k	Fatma	Yılmaz	+90 5474253734	deniz.yılmaz@example.com	\N	anne	f	t	2025-10-30 10:53:58.226	2025-10-30 10:53:58.226
cmhdb44ex003nr1t4srdnxmop	Fatma	Yılmaz	+90 5586970585	can.yılmaz@example.com	\N	anne	f	t	2025-10-30 10:53:58.233	2025-10-30 10:53:58.233
cmhdb44f3003qr1t4nz35bpsh	Fatma	Yılmaz	+90 5136893698	mustafa.yılmaz@example.com	\N	anne	f	t	2025-10-30 10:53:58.24	2025-10-30 10:53:58.24
cmhdb44fa003tr1t4293rnqux	Fatma	Kaya	+90 5893844307	burak.kaya@example.com	\N	anne	f	t	2025-10-30 10:53:58.247	2025-10-30 10:53:58.247
cmhdb44fh003wr1t48c01y9gr	Fatma	Demir	+90 5850405214	eren.demir@example.com	\N	anne	f	t	2025-10-30 10:53:58.254	2025-10-30 10:53:58.254
cmhdb44fo003zr1t4kgcuwep1	Fatma	Doğan	+90 5549006009	mert.doğan@example.com	\N	anne	f	t	2025-10-30 10:53:58.26	2025-10-30 10:53:58.26
cmhdb44fv0042r1t4uie1ru0s	Fatma	Şahin	+90 5474696504	emre.şahin@example.com	\N	anne	f	t	2025-10-30 10:53:58.268	2025-10-30 10:53:58.268
cmhdb44g20045r1t4s7wfo7q9	Fatma	Yıldız	+90 5174213233	mehmet.yıldız@example.com	\N	anne	f	t	2025-10-30 10:53:58.275	2025-10-30 10:53:58.275
cmhdb44g90048r1t4mlg9tanf	Fatma	Polat	+90 5636343277	deniz.polat@example.com	\N	anne	f	t	2025-10-30 10:53:58.282	2025-10-30 10:53:58.282
cmhdb44gf004br1t4qeme8evy	Fatma	Yılmaz	+90 5893884836	ahmet.yılmaz@example.com	\N	anne	f	t	2025-10-30 10:53:58.288	2025-10-30 10:53:58.288
cmhdb44gl004er1t4m0hwvy85	Fatma	Arslan	+90 5164329389	burak.arslan@example.com	\N	anne	f	t	2025-10-30 10:53:58.294	2025-10-30 10:53:58.294
cmhdb44gt004hr1t4q7lo2css	Fatma	Çelik	+90 5954873081	eren.çelik@example.com	\N	anne	f	t	2025-10-30 10:53:58.301	2025-10-30 10:53:58.301
cmhdb44gz004kr1t4vlur7j0b	Fatma	Yıldırım	+90 5863215257	eren.yıldırım@example.com	\N	anne	f	t	2025-10-30 10:53:58.307	2025-10-30 10:53:58.307
cmhdb44h5004nr1t4mvgc7csq	Fatma	Doğan	+90 5248901281	ahmet.doğan@example.com	\N	anne	f	t	2025-10-30 10:53:58.314	2025-10-30 10:53:58.314
cmhdb44hb004qr1t420va753f	Fatma	Öztürk	+90 5841788025	mehmet.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:58.32	2025-10-30 10:53:58.32
cmhdb44hh004tr1t4326wqvna	Fatma	Aydın	+90 5701610703	ahmet.aydın@example.com	\N	anne	f	t	2025-10-30 10:53:58.325	2025-10-30 10:53:58.325
cmhdb44hp004wr1t4yel8xpwn	Fatma	Kaya	+90 5922302569	kerem.kaya@example.com	\N	anne	f	t	2025-10-30 10:53:58.333	2025-10-30 10:53:58.333
cmhdb44hv004zr1t4tux31v2g	Fatma	Doğan	+90 5213877823	deniz.doğan@example.com	\N	anne	f	t	2025-10-30 10:53:58.339	2025-10-30 10:53:58.339
cmhdb44i10052r1t4f1u3pf8h	Fatma	Aydın	+90 5825968392	kerem.aydın@example.com	\N	anne	f	t	2025-10-30 10:53:58.345	2025-10-30 10:53:58.345
cmhdb44ia0055r1t41ui10jjw	Fatma	Özdemir	+90 5156554803	eren.özdemir@example.com	\N	anne	f	t	2025-10-30 10:53:58.355	2025-10-30 10:53:58.355
cmhdb44ik0058r1t4ruetkp8k	Fatma	Öztürk	+90 5763321630	eren.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:58.364	2025-10-30 10:53:58.364
cmhdb44it005br1t4l625lwl1	Fatma	Özdemir	+90 5783138883	kerem.özdemir@example.com	\N	anne	f	t	2025-10-30 10:53:58.374	2025-10-30 10:53:58.374
cmhdb44je005hr1t4dyxoxbta	Fatma	Yıldırım	+90 5391922120	cem.yıldırım@example.com	\N	anne	f	t	2025-10-30 10:53:58.394	2025-10-30 10:53:58.394
cmhdb44jm005kr1t4e2nc32qz	Fatma	Demir	+90 5377264570	eren.demir@example.com	\N	anne	f	t	2025-10-30 10:53:58.403	2025-10-30 10:53:58.403
cmhdb44js005nr1t43n1w26xj	Ayşe	Çelik	+90 5699484649	ali.çelik@example.com	\N	anne	f	t	2025-10-30 10:53:58.408	2025-10-30 10:53:58.408
cmhdb44k0005qr1t41tym7dfl	Fatma	Şahin	+90 5840124060	furkan.şahin@example.com	\N	anne	f	t	2025-10-30 10:53:58.417	2025-10-30 10:53:58.417
cmhdb44k6005tr1t484mhr6e8	Fatma	Şahin	+90 5985819306	kaan.şahin@example.com	\N	anne	f	t	2025-10-30 10:53:58.423	2025-10-30 10:53:58.423
cmhdb44kd005wr1t45wp6444w	Ayşe	Yıldırım	+90 5109217726	ali.yıldırım@example.com	\N	anne	f	t	2025-10-30 10:53:58.43	2025-10-30 10:53:58.43
cmhdb44kk005zr1t4mrps18zw	Fatma	Polat	+90 5374753487	kerem.polat@example.com	\N	anne	f	t	2025-10-30 10:53:58.436	2025-10-30 10:53:58.436
cmhdb44kq0062r1t4v5voahbn	Fatma	Aydın	+90 5564812121	mert.aydın@example.com	\N	anne	f	t	2025-10-30 10:53:58.442	2025-10-30 10:53:58.442
cmhdb44kx0065r1t439mjgmr9	Fatma	Kaya	+90 5855796438	furkan.kaya@example.com	\N	anne	f	t	2025-10-30 10:53:58.449	2025-10-30 10:53:58.449
cmhdb44l30068r1t4a2uwqh66	Fatma	Şahin	+90 5627202398	cem.şahin@example.com	\N	anne	f	t	2025-10-30 10:53:58.455	2025-10-30 10:53:58.455
cmhdb44la006br1t4ejucz5mu	Fatma	Yılmaz	+90 5242046953	emre.yılmaz@example.com	\N	anne	f	t	2025-10-30 10:53:58.463	2025-10-30 10:53:58.463
cmhdb44lh006er1t443xn9ib3	Fatma	Karaağaç	+90 5426436212	emre.karaağaç@example.com	\N	anne	f	t	2025-10-30 10:53:58.469	2025-10-30 10:53:58.469
cmhdb44ln006hr1t45n6wnx6f	Fatma	Karaağaç	+90 5987775731	berk.karaağaç@example.com	\N	anne	f	t	2025-10-30 10:53:58.475	2025-10-30 10:53:58.475
cmhdb44lu006kr1t49rrmn411	Fatma	Öztürk	+90 5623996702	emre.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:58.482	2025-10-30 10:53:58.482
cmhdb44m0006nr1t4f1ke8f37	Fatma	Aydın	+90 5498374411	can.aydın@example.com	\N	anne	f	t	2025-10-30 10:53:58.488	2025-10-30 10:53:58.488
cmhdb44m6006qr1t49ws26prh	Ayşe	Polat	+90 5355009485	ali.polat@example.com	\N	anne	f	t	2025-10-30 10:53:58.494	2025-10-30 10:53:58.494
cmhdb44md006tr1t4vje52ujv	Fatma	Öztürk	+90 5860105643	emre.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:58.501	2025-10-30 10:53:58.501
cmhdb44mi006wr1t4dljbez3a	Fatma	Öztürk	+90 5981013677	mehmet.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:58.507	2025-10-30 10:53:58.507
cmhdb44mp006zr1t4igp6zh19	Fatma	Demir	+90 5321126836	kerem.demir@example.com	\N	anne	f	t	2025-10-30 10:53:58.513	2025-10-30 10:53:58.513
cmhdb44mx0072r1t4buzur11j	Fatma	Demir	+90 5544484110	berk.demir@example.com	\N	anne	f	t	2025-10-30 10:53:58.521	2025-10-30 10:53:58.521
cmhdb44n30075r1t4aqfl9wvn	Fatma	Yıldız	+90 5102390010	mert.yıldız@example.com	\N	anne	f	t	2025-10-30 10:53:58.528	2025-10-30 10:53:58.528
cmhdb44na0078r1t4562i29ar	Fatma	Yıldırım	+90 5748020700	berk.yıldırım@example.com	\N	anne	f	t	2025-10-30 10:53:58.535	2025-10-30 10:53:58.535
cmhdb44ng007br1t4p26fhr8a	Fatma	Aydın	+90 5625855702	eren.aydın@example.com	\N	anne	f	t	2025-10-30 10:53:58.541	2025-10-30 10:53:58.541
cmhdb44nn007er1t4fn9159oi	Fatma	Polat	+90 5105034743	deniz.polat@example.com	\N	anne	f	t	2025-10-30 10:53:58.547	2025-10-30 10:53:58.547
cmhdb44nu007hr1t4rhhvub5j	Fatma	Polat	+90 5215148584	cem.polat@example.com	\N	anne	f	t	2025-10-30 10:53:58.555	2025-10-30 10:53:58.555
cmhdb44o0007kr1t4tho46ufv	Fatma	Kaya	+90 5920363021	eren.kaya@example.com	\N	anne	f	t	2025-10-30 10:53:58.561	2025-10-30 10:53:58.561
cmhdb44o8007nr1t43tfof4ov	Fatma	Demir	+90 5589736533	kaan.demir@example.com	\N	anne	f	t	2025-10-30 10:53:58.569	2025-10-30 10:53:58.569
cmhdb44or007wr1t4vcma76p2	Fatma	Öztürk	+90 5750080258	ahmet.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:58.588	2025-10-30 10:53:58.588
cmhdb44p50082r1t4dzh7tvgz	Fatma	Yıldız	+90 5972132575	cem.yıldız@example.com	\N	anne	f	t	2025-10-30 10:53:58.601	2025-10-30 10:53:58.601
cmhdb44pb0085r1t490nbrsst	Fatma	Aslan	+90 5284507152	emre.aslan@example.com	\N	anne	f	t	2025-10-30 10:53:58.607	2025-10-30 10:53:58.607
cmhdb44pi0088r1t429u7mfj4	Fatma	Arslan	+90 5287983669	can.arslan@example.com	\N	anne	f	t	2025-10-30 10:53:58.614	2025-10-30 10:53:58.614
cmhdb44po008br1t43pypzjm1	Fatma	Çelik	+90 5156506056	emre.çelik@example.com	\N	anne	f	t	2025-10-30 10:53:58.62	2025-10-30 10:53:58.62
cmhdb44pt008er1t44unc27vd	Fatma	Aslan	+90 5276505218	mustafa.aslan@example.com	\N	anne	f	t	2025-10-30 10:53:58.626	2025-10-30 10:53:58.626
cmhdb44q1008hr1t4nzjhtihf	Fatma	Çelik	+90 5975801203	ahmet.çelik@example.com	\N	anne	f	t	2025-10-30 10:53:58.633	2025-10-30 10:53:58.633
cmhdb44q7008kr1t4wdcao6pf	Fatma	Yıldız	+90 5711611474	mert.yıldız@example.com	\N	anne	f	t	2025-10-30 10:53:58.639	2025-10-30 10:53:58.639
cmhdb44ql008qr1t48aayam5i	Fatma	Şahin	+90 5273257580	burak.şahin@example.com	\N	anne	f	t	2025-10-30 10:53:58.653	2025-10-30 10:53:58.653
cmhdb44qq008tr1t4mi6f7lj8	Fatma	Öztürk	+90 5491915886	mustafa.öztürk@example.com	\N	anne	f	t	2025-10-30 10:53:58.659	2025-10-30 10:53:58.659
cmhdb44qx008wr1t4395rrntg	Fatma	Yılmaz	+90 5202033536	eren.yılmaz@example.com	\N	anne	f	t	2025-10-30 10:53:58.666	2025-10-30 10:53:58.666
cmhdb44r3008zr1t4i2u9w9xg	Fatma	Aydın	+90 5663527349	furkan.aydın@example.com	\N	anne	f	t	2025-10-30 10:53:58.671	2025-10-30 10:53:58.671
cmhdb44r90092r1t443rtzfmg	Fatma	Çelik	+90 5887655714	berk.çelik@example.com	\N	anne	f	t	2025-10-30 10:53:58.677	2025-10-30 10:53:58.677
cmhdb44rg0095r1t4hyxri1lj	Fatma	Aydın	+90 5478181120	berk.aydın@example.com	\N	anne	f	t	2025-10-30 10:53:58.684	2025-10-30 10:53:58.684
cmhdb44rm0098r1t4av5zp62a	Fatma	Şahin	+90 5125260222	ahmet.şahin@example.com	\N	anne	f	t	2025-10-30 10:53:58.69	2025-10-30 10:53:58.69
cmhdd07d40005r1ng5vlxjyak	Fatma	Arslan	+90 5726800721	ahmet.arslan@example.com	\N	Abi	t	t	2025-10-30 11:46:54.665	2025-10-30 11:46:54.665
cmhde43r20002r12cn9scwy8w	Fatma	Arslan	+90 5878929924	eren.arslan@example.com	\N	anne	f	t	2025-10-30 12:17:56.222	2025-10-30 12:17:56.222
cmhdevnq30000r1jwmelwu3ys	Fatma	Karaağaç	+90 5690833297	mehmet.karaaa@example.com	\N	anne	f	t	2025-10-30 12:39:21.819	2025-10-30 12:39:21.819
cmhdewpvz0001r1jw4cxef90d	Fatma	Yıldırım	+90 5453981340	mehmet@example.com	\N	anne	f	t	2025-10-30 12:40:11.279	2025-10-30 12:40:11.279
cmhdftwak0000r1bche8tmtfz	Fatma	Arslan	+90 5158147263	cem.arslan@example.com	\N	anne	f	t	2025-10-30 13:05:59.228	2025-10-30 13:05:59.228
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.payments (id, "studentId", "feeTypeId", amount, "dueDate", "paidDate", "paidAmount", "paymentMethod", status, "referenceNumber", notes, "receiptUrl", "createdAt", "updatedAt", "createdById") FROM stdin;
cmhdfxndm0002r1bchdp5dgds	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	2025-10-30 00:00:00	1500	CASH	CANCELLED	\N	DELETED by Admin User	\N	2025-10-30 13:08:54.298	2025-10-30 20:32:12.093	cmhd9znsp0000r1v4xcv3034p
cmhdg7qou000ur1bcwu9zks1u	cmhdb44qg008pr1t4fa3acvp1	cmhdday4v0007r1ngm8ch3in1	18000	2026-10-30 00:00:00	2025-10-30 00:00:00	8000	CASH	CANCELLED	\N	DELETED by Admin User	\N	2025-10-30 13:16:45.151	2025-10-30 20:32:29.266	cmhd9znsp0000r1v4xcv3034p
cmhdfz0dt0004r1bcz4q8uic1	cmhdb44j8005gr1t4144a41vc	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	2025-10-30 00:00:00	1500	CASH	CANCELLED	\N	DELETED by Admin User	\N	2025-10-30 13:09:57.808	2025-10-30 20:32:42.756	cmhd9znsp0000r1v4xcv3034p
cmhit64sv0003r1mgzio5tfn8	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-12-03 00:00:00	\N	\N	\N	CANCELLED	\N	CANCELLED by Admin User	\N	2025-11-03 07:18:16.015	2025-11-03 18:45:23.516	cmhd9znsp0000r1v4xcv3034p
cmheiuxwp0009r1ess4g6lktc	cmhdb44ap001pr1t454nizq6a	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:18:32.995	2025-11-03 18:45:22.629	cmhd9znsp0000r1v4xcv3034p
cmheiuxwt000lr1esdi4bocte	cmhdb449u001ar1t4qkumcyr4	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:18:32.995	2025-11-03 18:45:22.796	cmhd9znsp0000r1v4xcv3034p
cmheiuxwo0007r1eschp2lt4s	cmhdb449o0017r1t43x45j7s1	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:18:32.995	2025-11-03 18:45:22.977	cmhd9znsp0000r1v4xcv3034p
cmhdfz0dv000mr1bcuxnqfpmx	cmhdb4494000yr1t4qufjpmb5	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | RESET by Admin User | RESET by Admin User | CANCELLED by Admin User	\N	2025-10-30 13:09:57.808	2025-11-03 18:45:16.078	cmhd9znsp0000r1v4xcv3034p
cmheil71x0001r1eszhi6rdne	cmhdb44j8005gr1t4144a41vc	cmhd9zntt0006r1v4f0t1yx4r	1250	2025-12-01 00:00:00	\N	\N	\N	CANCELLED	\N	CANCELLED by Admin User	\N	2025-10-31 07:10:58.29	2025-11-03 18:45:23.157	cmhd9znsp0000r1v4xcv3034p
cmheiuxwq000dr1eshrg9ml8p	cmhdb449i0014r1t4w01bjq1n	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:18:32.995	2025-11-03 18:45:22.452	cmhd9znsp0000r1v4xcv3034p
cmhdfz0du000cr1bc5cjx0hwg	cmhdb448q000sr1t48rq4fxwx	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	2025-10-30 00:00:00	1500	CASH	CANCELLED	\N	CANCELLED by Admin User	\N	2025-10-30 13:09:57.808	2025-11-03 18:45:22.1	cmhd9znsp0000r1v4xcv3034p
cmheiuxwr000fr1esw8zpc624	cmhdb44av001sr1t4c6jkzm71	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:18:32.995	2025-11-03 18:45:21.926	cmhd9znsp0000r1v4xcv3034p
cmheiuxwr000hr1essqaen5zy	cmhdb44ai001mr1t4dujla972	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:18:32.995	2025-11-03 18:45:21.749	cmhd9znsp0000r1v4xcv3034p
cmheiuxws000jr1esr7uh2uit	cmhdb449b0011r1t42olumgwe	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:18:32.995	2025-11-03 18:45:21.541	cmhd9znsp0000r1v4xcv3034p
cmhdfz0dw000sr1bcdzg8ztcn	cmhdb447s000dr1t4ch03fjjh	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-30 13:09:57.808	2025-11-03 18:45:19.9	cmhd9znsp0000r1v4xcv3034p
cmheiytmj000rr1estqgfh00n	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-09-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:21:34.075	2025-11-03 18:45:13.338	cmhd9znsp0000r1v4xcv3034p
cmhdfz0dv000or1bc1wmeryuw	cmhdb448c000mr1t405jsjzin	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-30 13:09:57.808	2025-11-03 18:45:18.824	cmhd9znsp0000r1v4xcv3034p
cmhdfz0du000gr1bciya7wsy2	cmhdb448j000pr1t4fy1c1isw	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-30 13:09:57.808	2025-11-03 18:45:18.283	cmhd9znsp0000r1v4xcv3034p
cmheiuxwt000nr1esrsefx7px	cmhdb44a0001dr1t464b6jfpl	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | RESET by Admin User | RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:18:32.995	2025-11-03 18:45:17.786	cmhd9znsp0000r1v4xcv3034p
cmhdfz0du000ar1bcdn3hzlz6	cmhdb447m000ar1t4oq4jfvy9	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | RESET by Admin User | RESET by Admin User | CANCELLED by Admin User	\N	2025-10-30 13:09:57.808	2025-11-03 18:45:17.055	cmhd9znsp0000r1v4xcv3034p
cmhdfz0dv000kr1bch4isxn8v	cmhdb44og007sr1t4n9u6r2b8	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | RESET by Admin User | CANCELLED by Admin User	\N	2025-10-30 13:09:57.808	2025-11-03 18:45:18.47	cmhd9znsp0000r1v4xcv3034p
cmhdfz0du0008r1bcgejwoc5c	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | RESET by Admin User | CANCELLED by Admin User	\N	2025-10-30 13:09:57.808	2025-11-03 18:45:19.189	cmhd9znsp0000r1v4xcv3034p
cmheiuxwu000pr1esay8gr8i9	cmhdb44a6001gr1t45nm1ffw5	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:18:32.995	2025-11-03 18:45:19.602	cmhd9znsp0000r1v4xcv3034p
cmhdfz0dv000qr1bcumg8vrqz	cmhdb4485000jr1t47v0b7l5d	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-30 13:09:57.808	2025-11-03 18:45:20.286	cmhd9znsp0000r1v4xcv3034p
cmhdfz0dv000ir1bce2n4vk9o	cmhdb448y000vr1t4uw2yqway	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-30 13:09:57.808	2025-11-03 18:45:20.655	cmhd9znsp0000r1v4xcv3034p
cmhdfz0du000er1bccf5nwhp6	cmhdb44790007r1t44uygdrl8	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-30 13:09:57.808	2025-11-03 18:45:21.157	cmhd9znsp0000r1v4xcv3034p
cmheiuxwp000br1esm5nad0xg	cmhdb44ad001jr1t4wppt5s84	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:18:32.995	2025-11-03 18:45:22.271	cmhd9znsp0000r1v4xcv3034p
cmhit5uh60001r1mgn7sme5iu	cmhdb449o0017r1t43x45j7s1	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-12-03 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | CANCELLED by Admin User	\N	2025-11-03 07:18:02.632	2025-11-03 18:45:23.336	cmhd9znsp0000r1v4xcv3034p
cmhit6mbb0005r1mgvzdoxsaj	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-01-03 00:00:00	\N	\N	\N	CANCELLED	\N	CANCELLED by Admin User	\N	2025-11-03 07:18:38.711	2025-11-03 18:45:23.697	cmhd9znsp0000r1v4xcv3034p
cmhjfzu3z0001ni01g85x3har	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-01-03 00:00:00	\N	\N	\N	CANCELLED	\N	CANCELLED by Admin User	\N	2025-11-03 17:57:13.391	2025-11-03 18:45:24.447	cmhd9znsp0000r1v4xcv3034p
cmheiuxwo0005r1es4cpz1tuv	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-30 00:00:00	\N	\N	\N	CANCELLED	\N	RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | RESET by Admin User | CANCELLED by Admin User	\N	2025-10-31 07:18:32.995	2025-11-03 18:45:21.355	cmhd9znsp0000r1v4xcv3034p
cmhjhqey10001oj01932uiget	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 1/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:35.885	cmhd9znsp0000r1v4xcv3034p
cmhjht66k000poj013ryi6fzb	cmhdb44go004gr1t4t7byvy36	cmheinn310003r1estju9c9r5	1450	2025-11-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 1/8 | CANCELLED by Admin User	\N	2025-11-03 18:48:01.672	2025-11-03 19:52:37.781	cmhd9znsp0000r1v4xcv3034p
cmhjhqey20003oj01mb6vpekx	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-12-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 2/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:39.393	cmhd9znsp0000r1v4xcv3034p
cmhjht66l000roj0137902qxl	cmhdb44go004gr1t4t7byvy36	cmheinn310003r1estju9c9r5	1450	2025-12-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 2/8 | CANCELLED by Admin User	\N	2025-11-03 18:48:01.672	2025-11-03 19:52:40.005	cmhd9znsp0000r1v4xcv3034p
cmhjhqey40005oj017ebkh782	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-01-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 3/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:40.498	cmhd9znsp0000r1v4xcv3034p
cmhjht66n000toj019m0ndcd5	cmhdb44go004gr1t4t7byvy36	cmheinn310003r1estju9c9r5	1450	2026-01-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 3/8 | CANCELLED by Admin User	\N	2025-11-03 18:48:01.672	2025-11-03 19:52:41.043	cmhd9znsp0000r1v4xcv3034p
cmhjhqey50007oj01n16canwf	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-02-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 4/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:41.539	cmhd9znsp0000r1v4xcv3034p
cmhjht66o000voj01r83zsg9w	cmhdb44go004gr1t4t7byvy36	cmheinn310003r1estju9c9r5	1450	2026-02-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 4/8 | CANCELLED by Admin User	\N	2025-11-03 18:48:01.672	2025-11-03 19:52:41.805	cmhd9znsp0000r1v4xcv3034p
cmhjht66p000xoj01n1ka0cie	cmhdb44go004gr1t4t7byvy36	cmheinn310003r1estju9c9r5	1450	2026-03-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 5/8 | CANCELLED by Admin User	\N	2025-11-03 18:48:01.672	2025-11-03 19:52:42.173	cmhd9znsp0000r1v4xcv3034p
cmhjhqey60009oj01hmjf9ef7	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-03-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 5/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:42.356	cmhd9znsp0000r1v4xcv3034p
cmhjht66q000zoj01t6g72zm2	cmhdb44go004gr1t4t7byvy36	cmheinn310003r1estju9c9r5	1450	2026-04-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 6/8 | CANCELLED by Admin User	\N	2025-11-03 18:48:01.672	2025-11-03 19:52:42.534	cmhd9znsp0000r1v4xcv3034p
cmhjhqey8000boj01n59vzvwb	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-04-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 6/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:42.878	cmhd9znsp0000r1v4xcv3034p
cmhjhqeya000doj01cke9awzi	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-05-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 7/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:43.191	cmhd9znsp0000r1v4xcv3034p
cmhjht66r0011oj01toazeymq	cmhdb44go004gr1t4t7byvy36	cmheinn310003r1estju9c9r5	1450	2026-05-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 7/8 | CANCELLED by Admin User	\N	2025-11-03 18:48:01.672	2025-11-03 19:52:43.354	cmhd9znsp0000r1v4xcv3034p
cmhjhqeyb000foj01d91j3c8d	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-06-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 8/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:43.537	cmhd9znsp0000r1v4xcv3034p
cmhjht66s0013oj01muo1iugq	cmhdb44go004gr1t4t7byvy36	cmheinn310003r1estju9c9r5	1450	2026-06-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 8/8 | CANCELLED by Admin User	\N	2025-11-03 18:48:01.672	2025-11-03 19:52:43.872	cmhd9znsp0000r1v4xcv3034p
cmhjhqeyc000hoj011kq6xxme	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-07-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 9/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:44.203	cmhd9znsp0000r1v4xcv3034p
cmhjhqeyd000joj01pa92h5mp	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-08-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 10/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:44.399	cmhd9znsp0000r1v4xcv3034p
cmhjhqeye000loj01m0sy38wh	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-09-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 11/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:44.563	cmhd9znsp0000r1v4xcv3034p
cmhjhqeyf000noj01dh301gvj	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-10-03 00:00:00	\N	\N	\N	CANCELLED	\N	Vade 12/12 | CANCELLED by Admin User	\N	2025-11-03 18:45:53.064	2025-11-03 19:52:44.759	cmhd9znsp0000r1v4xcv3034p
cmhjk4o720003pm01qhxgx4zi	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-12-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 2/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:52:57.469	cmhd9znsp0000r1v4xcv3034p
cmhjk4o730005pm01b1xxonfc	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-01-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 3/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:52:57.469	cmhd9znsp0000r1v4xcv3034p
cmhjk4o740007pm01hay0gcc0	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-02-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 4/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:52:57.469	cmhd9znsp0000r1v4xcv3034p
cmhjk4o750009pm01d3f5n0sa	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-03-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 5/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:52:57.469	cmhd9znsp0000r1v4xcv3034p
cmhjk4o76000bpm015rjdjy6o	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-04-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 6/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:52:57.469	cmhd9znsp0000r1v4xcv3034p
cmhjk4o77000dpm01qjxvv3dx	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-05-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 7/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:52:57.469	cmhd9znsp0000r1v4xcv3034p
cmhjk4o78000fpm01wkzzvpbl	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-06-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 8/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:52:57.469	cmhd9znsp0000r1v4xcv3034p
cmhjk4o79000hpm018hldrcll	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-07-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 9/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:52:57.469	cmhd9znsp0000r1v4xcv3034p
cmhjk4o7a000jpm01dn0wk1n7	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-08-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 10/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:52:57.469	cmhd9znsp0000r1v4xcv3034p
cmhjk4o7a000lpm011ui66fp1	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-09-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 11/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:52:57.469	cmhd9znsp0000r1v4xcv3034p
cmhjk4o7b000npm0145bor0q8	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-10-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 12/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:52:57.469	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxj000tpm01ljcwoe4j	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-01-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 3/12	\N	2025-11-03 19:53:29.524	2025-11-03 19:53:29.524	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxk000vpm013i07bb2x	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-02-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 4/12	\N	2025-11-03 19:53:29.524	2025-11-03 19:53:29.524	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxl000xpm01jpafp6eh	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-03-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 5/12	\N	2025-11-03 19:53:29.524	2025-11-03 19:53:29.524	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxm000zpm01wff2cnzx	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-04-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 6/12	\N	2025-11-03 19:53:29.524	2025-11-03 19:53:29.524	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxn0011pm01jyh9qbbo	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-05-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 7/12	\N	2025-11-03 19:53:29.524	2025-11-03 19:53:29.524	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxo0013pm01zwwsyzwu	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-06-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 8/12	\N	2025-11-03 19:53:29.524	2025-11-03 19:53:29.524	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxp0015pm01nnkgy0j6	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-07-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 9/12	\N	2025-11-03 19:53:29.524	2025-11-03 19:53:29.524	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxq0017pm01t5az3ye7	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-08-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 10/12	\N	2025-11-03 19:53:29.524	2025-11-03 19:53:29.524	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxr0019pm01swreldd0	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-09-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 11/12	\N	2025-11-03 19:53:29.524	2025-11-03 19:53:29.524	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxr001bpm01z8jnpd12	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-10-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 12/12	\N	2025-11-03 19:53:29.524	2025-11-03 19:53:29.524	cmhd9znsp0000r1v4xcv3034p
cmhjk4o710001pm01lvp13s77	cmhdb44qg008pr1t4fa3acvp1	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-03 00:00:00	2025-11-03 00:00:00	1500	CASH	PAID	PLAN_1762199577458_cmhdb44q	PLAN_1762199577458_cmhdb44q - Vade 1/12	\N	2025-11-03 19:52:57.469	2025-11-03 19:55:25.783	cmhd9znsp0000r1v4xcv3034p
cmhjk91da001hpm013hu3k4rt	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-01-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 3/12	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:21.163	cmhd9znsp0000r1v4xcv3034p
cmhjk91db001jpm01ghejrghp	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-02-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 4/12	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:21.163	cmhd9znsp0000r1v4xcv3034p
cmhjk91dc001lpm014n0fulzo	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-03-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 5/12	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:21.163	cmhd9znsp0000r1v4xcv3034p
cmhjk91dd001npm014px7v06l	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-04-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 6/12	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:21.163	cmhd9znsp0000r1v4xcv3034p
cmhjk91de001ppm01sagnbz9i	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-05-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 7/12	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:21.163	cmhd9znsp0000r1v4xcv3034p
cmhjk91df001rpm01zy7d43rp	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-06-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 8/12	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:21.163	cmhd9znsp0000r1v4xcv3034p
cmhjk91dg001tpm01dkn9rzzg	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-07-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 9/12	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:21.163	cmhd9znsp0000r1v4xcv3034p
cmhjk91dh001vpm01608nksnt	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-08-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 10/12	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:21.163	cmhd9znsp0000r1v4xcv3034p
cmhjk91dj001xpm011d5th63t	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-09-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 11/12	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:21.163	cmhd9znsp0000r1v4xcv3034p
cmhjk91dk001zpm01q6zw30af	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2026-10-03 00:00:00	\N	\N	\N	PENDING	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 12/12	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:21.163	cmhd9znsp0000r1v4xcv3034p
cmhjk91d8001dpm01jogmn9sz	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-03 00:00:00	\N	\N	\N	CANCELLED	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 1/12 | CANCELLED by Admin User	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:36.674	cmhd9znsp0000r1v4xcv3034p
cmhjk91d9001fpm01i4z6ox4u	cmhdb44dp0034r1t4epvjtorf	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-12-03 00:00:00	\N	\N	\N	CANCELLED	PLAN_1762199781151_cmhdb44d	PLAN_1762199781151_cmhdb44d - Vade 2/12 | CANCELLED by Admin User	\N	2025-11-03 19:56:21.163	2025-11-03 19:56:38.743	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxg000ppm010w983twf	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-11-03 00:00:00	2025-11-03 00:00:00	1500	CASH	PAID	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 1/12	\N	2025-11-03 19:53:29.524	2025-11-03 19:59:26.646	cmhd9znsp0000r1v4xcv3034p
cmhjk5cxh000rpm01g88zxi4m	cmhdb447z000gr1t4oev9cqoj	cmhd9zntt0006r1v4f0t1yx4r	1500	2025-12-03 00:00:00	2025-11-04 00:00:00	1500	CASH	PAID	PLAN_1762199609512_cmhdb447	PLAN_1762199609512_cmhdb447 - Vade 2/12	\N	2025-11-03 19:53:29.524	2025-11-04 07:10:43.172	cmhd9znsp0000r1v4xcv3034p
\.


--
-- Data for Name: students; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.students (id, "firstName", "lastName", phone, "birthDate", "groupId", "isActive", "enrollmentDate", "createdAt", "updatedAt", "createdById") FROM stdin;
cmhdb44790007r1t44uygdrl8	Ali	Demir	+90 5747742817	2017-10-30 10:53:57.956	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:57.958	2025-10-30 10:53:57.958	2025-10-30 10:53:57.958	cmhd9znsp0000r1v4xcv3034p
cmhdb447m000ar1t4oq4jfvy9	Burak	Aydın	+90 5129973572	2016-10-30 10:53:57.969	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:57.97	2025-10-30 10:53:57.97	2025-10-30 10:53:57.97	cmhd9znsp0000r1v4xcv3034p
cmhdb447s000dr1t4ch03fjjh	Kerem	Öztürk	+90 5293349095	2015-10-30 10:53:57.975	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:57.976	2025-10-30 10:53:57.976	2025-10-30 10:53:57.976	cmhd9znsp0000r1v4xcv3034p
cmhdb447z000gr1t4oev9cqoj	Berk	Aydın	+90 5504335172	2013-10-30 11:53:57.983	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:57.984	2025-10-30 10:53:57.984	2025-10-30 10:53:57.984	cmhd9znsp0000r1v4xcv3034p
cmhdb4485000jr1t47v0b7l5d	Furkan	Öztürk	+90 5741190101	2013-10-30 11:53:57.988	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:57.99	2025-10-30 10:53:57.99	2025-10-30 10:53:57.99	cmhd9znsp0000r1v4xcv3034p
cmhdb448c000mr1t405jsjzin	Ahmet	Özdemir	+90 5651371378	2014-10-30 11:53:57.995	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:57.996	2025-10-30 10:53:57.996	2025-10-30 10:53:57.996	cmhd9znsp0000r1v4xcv3034p
cmhdb448j000pr1t4fy1c1isw	Emre	Doğan	+90 5868152193	2014-10-30 11:53:58.003	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:58.004	2025-10-30 10:53:58.004	2025-10-30 10:53:58.004	cmhd9znsp0000r1v4xcv3034p
cmhdb448q000sr1t48rq4fxwx	Ahmet	Demir	+90 5166912625	2017-10-30 10:53:58.01	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:58.011	2025-10-30 10:53:58.011	2025-10-31 11:15:52.81	cmhd9znsp0000r1v4xcv3034p
cmhdb448y000vr1t4uw2yqway	Berk	Karaağaç	+90 5936627792	2013-10-30 11:53:58.017	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:58.018	2025-10-30 10:53:58.018	2025-10-30 10:53:58.018	cmhd9znsp0000r1v4xcv3034p
cmhdb4494000yr1t4qufjpmb5	Mehmet	Karaağaç	+90 5814184830	2017-10-30 10:53:58.023	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:58.024	2025-10-30 10:53:58.024	2025-10-30 10:53:58.024	cmhd9znsp0000r1v4xcv3034p
cmhdb449b0011r1t42olumgwe	Mustafa	Yılmaz	+90 5828772117	2016-10-30 10:53:58.031	cmhd9znt70002r1v46mrowpnl	t	2025-10-30 10:53:58.032	2025-10-30 10:53:58.032	2025-10-30 10:53:58.032	cmhd9znsp0000r1v4xcv3034p
cmhdb449i0014r1t4w01bjq1n	Cem	Doğan	+90 5558225524	2014-10-30 11:53:58.037	cmhd9znt70002r1v46mrowpnl	t	2025-10-30 10:53:58.038	2025-10-30 10:53:58.038	2025-10-30 10:53:58.038	cmhd9znsp0000r1v4xcv3034p
cmhdb449o0017r1t43x45j7s1	Mustafa	Arslan	+90 5431715671	2013-10-30 11:53:58.043	cmhd9znt70002r1v46mrowpnl	t	2025-10-30 10:53:58.044	2025-10-30 10:53:58.044	2025-10-30 10:53:58.044	cmhd9znsp0000r1v4xcv3034p
cmhdb449u001ar1t4qkumcyr4	Ahmet	Çelik	+90 5908093845	2017-10-30 10:53:58.05	cmhd9znt70002r1v46mrowpnl	t	2025-10-30 10:53:58.051	2025-10-30 10:53:58.051	2025-10-30 10:53:58.051	cmhd9znsp0000r1v4xcv3034p
cmhdb44a0001dr1t464b6jfpl	Ali	Şahin	+90 5533767083	2016-10-30 10:53:58.055	cmhd9znt70002r1v46mrowpnl	t	2025-10-30 10:53:58.056	2025-10-30 10:53:58.056	2025-10-30 10:53:58.056	cmhd9znsp0000r1v4xcv3034p
cmhdb44a6001gr1t45nm1ffw5	Deniz	Şahin	+90 5426143078	2013-10-30 11:53:58.062	cmhd9znt70002r1v46mrowpnl	t	2025-10-30 10:53:58.063	2025-10-30 10:53:58.063	2025-10-30 10:53:58.063	cmhd9znsp0000r1v4xcv3034p
cmhdb44ai001mr1t4dujla972	Mehmet	Yıldız	+90 5137410789	2016-10-30 10:53:58.074	cmhd9znt70002r1v46mrowpnl	t	2025-10-30 10:53:58.075	2025-10-30 10:53:58.075	2025-10-30 10:53:58.075	cmhd9znsp0000r1v4xcv3034p
cmhdb44ap001pr1t454nizq6a	Mert	Aslan	+90 5542696812	2017-10-30 10:53:58.08	cmhd9znt70002r1v46mrowpnl	t	2025-10-30 10:53:58.082	2025-10-30 10:53:58.082	2025-10-30 10:53:58.082	cmhd9znsp0000r1v4xcv3034p
cmhdb44av001sr1t4c6jkzm71	Ahmet	Yıldırım	+90 5179024133	2015-10-30 10:53:58.086	cmhd9znt70002r1v46mrowpnl	t	2025-10-30 10:53:58.087	2025-10-30 10:53:58.087	2025-10-30 10:53:58.087	cmhd9znsp0000r1v4xcv3034p
cmhdb44b1001vr1t45svlqmik	Mustafa	Aslan	+90 5214118191	2014-10-30 11:53:58.093	cmhd9zntc0003r1v4bn7a8y52	t	2025-10-30 10:53:58.094	2025-10-30 10:53:58.094	2025-10-30 10:53:58.094	cmhd9znsp0000r1v4xcv3034p
cmhdb44b9001yr1t470an1pqm	Mehmet	Aslan	+90 5331581246	2013-10-30 11:53:58.1	cmhd9zntc0003r1v4bn7a8y52	t	2025-10-30 10:53:58.101	2025-10-30 10:53:58.101	2025-10-30 10:53:58.101	cmhd9znsp0000r1v4xcv3034p
cmhdb44bg0021r1t4gwymz6j0	Mehmet	Demir	+90 5744529208	2013-10-30 11:53:58.107	cmhd9zntc0003r1v4bn7a8y52	t	2025-10-30 10:53:58.108	2025-10-30 10:53:58.108	2025-10-30 10:53:58.108	cmhd9znsp0000r1v4xcv3034p
cmhdb44bn0024r1t4sfc4zx0b	Kerem	Aslan	+90 5184806729	2014-10-30 11:53:58.115	cmhd9zntc0003r1v4bn7a8y52	t	2025-10-30 10:53:58.116	2025-10-30 10:53:58.116	2025-10-30 10:53:58.116	cmhd9znsp0000r1v4xcv3034p
cmhdb44bt0027r1t4yj2fcxc6	Mehmet	Yıldız	+90 5178512269	2014-10-30 11:53:58.12	cmhd9zntc0003r1v4bn7a8y52	t	2025-10-30 10:53:58.121	2025-10-30 10:53:58.121	2025-10-30 10:53:58.121	cmhd9znsp0000r1v4xcv3034p
cmhdb44bz002ar1t4mal9fmn9	Deniz	Çelik	+90 5286214005	2013-10-30 11:53:58.126	cmhd9zntc0003r1v4bn7a8y52	t	2025-10-30 10:53:58.127	2025-10-30 10:53:58.127	2025-10-30 10:53:58.127	cmhd9znsp0000r1v4xcv3034p
cmhdb44c5002dr1t4r7fwptmc	Berk	Yıldız	+90 5164870126	2016-10-30 10:53:58.133	cmhd9zntc0003r1v4bn7a8y52	t	2025-10-30 10:53:58.134	2025-10-30 10:53:58.134	2025-10-30 10:53:58.134	cmhd9znsp0000r1v4xcv3034p
cmhdb44cb002gr1t4cs48p26i	Can	Doğan	+90 5616038687	2017-10-30 10:53:58.138	cmhd9zntc0003r1v4bn7a8y52	t	2025-10-30 10:53:58.139	2025-10-30 10:53:58.139	2025-10-30 10:53:58.139	cmhd9znsp0000r1v4xcv3034p
cmhdb44ci002jr1t4yinlv2xk	Kaan	Yılmaz	+90 5615265813	2017-10-30 10:53:58.145	cmhd9zntc0003r1v4bn7a8y52	t	2025-10-30 10:53:58.146	2025-10-30 10:53:58.146	2025-10-30 10:53:58.146	cmhd9znsp0000r1v4xcv3034p
cmhdb44co002mr1t41c383shu	Cem	Aslan	+90 5540690794	2017-10-30 10:53:58.151	cmhd9zntc0003r1v4bn7a8y52	t	2025-10-30 10:53:58.152	2025-10-30 10:53:58.152	2025-10-30 10:53:58.152	cmhd9znsp0000r1v4xcv3034p
cmhdb44cu002pr1t4k0tecvjv	Mehmet	Polat	+90 5900303593	2016-10-30 10:53:58.157	cmhd9zntm0005r1v4i1pt5mx1	t	2025-10-30 10:53:58.158	2025-10-30 10:53:58.158	2025-10-30 10:53:58.158	cmhd9znsp0000r1v4xcv3034p
cmhdb44d1002sr1t4siqaos13	Can	Yılmaz	+90 5194259321	2014-10-30 11:53:58.164	cmhd9zntm0005r1v4i1pt5mx1	t	2025-10-30 10:53:58.165	2025-10-30 10:53:58.165	2025-10-30 10:53:58.165	cmhd9znsp0000r1v4xcv3034p
cmhdb44d7002vr1t4bo1oru3x	Mert	Demir	+90 5645074199	2014-10-30 11:53:58.17	cmhd9zntm0005r1v4i1pt5mx1	t	2025-10-30 10:53:58.171	2025-10-30 10:53:58.171	2025-10-30 10:53:58.171	cmhd9znsp0000r1v4xcv3034p
cmhdb44dd002yr1t4olftfbwb	Mehmet	Özdemir	+90 5402896182	2016-10-30 10:53:58.176	cmhd9zntm0005r1v4i1pt5mx1	t	2025-10-30 10:53:58.177	2025-10-30 10:53:58.177	2025-10-30 10:53:58.177	cmhd9znsp0000r1v4xcv3034p
cmhdb44dj0031r1t4zl4vbwo0	Cem	Özdemir	+90 5626967541	2013-10-30 11:53:58.183	cmhd9zntm0005r1v4i1pt5mx1	t	2025-10-30 10:53:58.184	2025-10-30 10:53:58.184	2025-10-30 10:53:58.184	cmhd9znsp0000r1v4xcv3034p
cmhdb44dp0034r1t4epvjtorf	Deniz	Aydın	+90 5198603865	2015-10-30 10:53:58.189	cmhd9zntm0005r1v4i1pt5mx1	t	2025-10-30 10:53:58.189	2025-10-30 10:53:58.189	2025-10-30 10:53:58.189	cmhd9znsp0000r1v4xcv3034p
cmhdb44dw0037r1t4qiec9kyx	Kerem	Öztürk	+90 5948483877	2017-10-30 10:53:58.195	cmhd9zntm0005r1v4i1pt5mx1	t	2025-10-30 10:53:58.196	2025-10-30 10:53:58.196	2025-10-30 10:53:58.196	cmhd9znsp0000r1v4xcv3034p
cmhdb44e2003ar1t4ftyb614q	Cem	Öztürk	+90 5305444278	2017-10-30 10:53:58.201	cmhd9zntm0005r1v4i1pt5mx1	t	2025-10-30 10:53:58.202	2025-10-30 10:53:58.202	2025-10-30 10:53:58.202	cmhd9znsp0000r1v4xcv3034p
cmhdb44e8003dr1t4hlnotlkx	Can	Çelik	+90 5184139772	2017-10-30 10:53:58.207	cmhd9zntm0005r1v4i1pt5mx1	t	2025-10-30 10:53:58.208	2025-10-30 10:53:58.208	2025-10-30 10:53:58.208	cmhd9znsp0000r1v4xcv3034p
cmhdb44ee003gr1t4cx22hn6n	Kerem	Arslan	+90 5280820566	2015-10-30 10:53:58.214	cmhd9zntm0005r1v4i1pt5mx1	t	2025-10-30 10:53:58.215	2025-10-30 10:53:58.215	2025-10-30 10:53:58.215	cmhd9znsp0000r1v4xcv3034p
cmhdb44el003jr1t4319vpqqd	Ali	Öztürk	+90 5426069684	2013-10-30 11:53:58.22	cmhdb0qy50001r14k4ftgb16s	t	2025-10-30 10:53:58.221	2025-10-30 10:53:58.221	2025-10-30 10:53:58.221	cmhd9znsp0000r1v4xcv3034p
cmhdb44er003mr1t45k7m1u79	Deniz	Yılmaz	+90 5589451964	2017-10-30 10:53:58.227	cmhdb0qy50001r14k4ftgb16s	t	2025-10-30 10:53:58.228	2025-10-30 10:53:58.228	2025-10-30 10:53:58.228	cmhd9znsp0000r1v4xcv3034p
cmhdb44ez003pr1t4rgc1vv2i	Can	Yılmaz	+90 5609456831	2013-10-30 11:53:58.234	cmhdb0qy50001r14k4ftgb16s	t	2025-10-30 10:53:58.235	2025-10-30 10:53:58.235	2025-10-30 10:53:58.235	cmhd9znsp0000r1v4xcv3034p
cmhdb44f5003sr1t4my06vaw0	Mustafa	Yılmaz	+90 5101215743	2015-10-30 10:53:58.241	cmhdb0qy50001r14k4ftgb16s	t	2025-10-30 10:53:58.242	2025-10-30 10:53:58.242	2025-10-30 10:53:58.242	cmhd9znsp0000r1v4xcv3034p
cmhdb44ri0097r1t4cmve5yq6	Berk	Aydın	+90 5943776514	2014-10-30 11:53:58.685	\N	t	2025-10-30 10:53:58.686	2025-10-30 10:53:58.686	2025-10-30 11:47:28.579	cmhd9znsp0000r1v4xcv3034p
cmhdb44fd003vr1t4ac6p4bxo	Burak	Kaya	+90 5657395199	2014-10-30 11:53:58.248	cmhdb0qy50001r14k4ftgb16s	t	2025-10-30 10:53:58.249	2025-10-30 10:53:58.249	2025-10-30 10:53:58.249	cmhd9znsp0000r1v4xcv3034p
cmhdb44fj003yr1t42usw2nqf	Eren	Demir	+90 5595047502	2015-10-30 10:53:58.255	cmhdb0qy50001r14k4ftgb16s	t	2025-10-30 10:53:58.256	2025-10-30 10:53:58.256	2025-10-30 10:53:58.256	cmhd9znsp0000r1v4xcv3034p
cmhdb44fq0041r1t4qjm6go6y	Mert	Doğan	+90 5199349674	2015-10-30 10:53:58.262	cmhdb0qy50001r14k4ftgb16s	t	2025-10-30 10:53:58.263	2025-10-30 10:53:58.263	2025-10-30 10:53:58.263	cmhd9znsp0000r1v4xcv3034p
cmhdb44fy0044r1t4bece1zsc	Emre	Şahin	+90 5443761086	2015-10-30 10:53:58.269	cmhdb0qy50001r14k4ftgb16s	t	2025-10-30 10:53:58.27	2025-10-30 10:53:58.27	2025-10-30 10:53:58.27	cmhd9znsp0000r1v4xcv3034p
cmhdb44g40047r1t4pek7rcbo	Mehmet	Yıldız	+90 5621553117	2013-10-30 11:53:58.276	cmhdb0qy50001r14k4ftgb16s	t	2025-10-30 10:53:58.277	2025-10-30 10:53:58.277	2025-10-30 10:53:58.277	cmhd9znsp0000r1v4xcv3034p
cmhdb44gb004ar1t4dm4odllm	Deniz	Polat	+90 5294627854	2014-10-30 11:53:58.282	cmhdb0qy50001r14k4ftgb16s	t	2025-10-30 10:53:58.283	2025-10-30 10:53:58.283	2025-10-30 10:53:58.283	cmhd9znsp0000r1v4xcv3034p
cmhdb44gh004dr1t48b9sho12	Ahmet	Yılmaz	+90 5273147250	2015-10-30 10:53:58.288	cmhdb10s00003r14k063dfdts	t	2025-10-30 10:53:58.289	2025-10-30 10:53:58.289	2025-10-30 10:53:58.289	cmhd9znsp0000r1v4xcv3034p
cmhdb44go004gr1t4t7byvy36	Burak	Arslan	+90 5678682753	2015-10-30 10:53:58.295	cmhdb10s00003r14k063dfdts	t	2025-10-30 10:53:58.296	2025-10-30 10:53:58.296	2025-10-30 10:53:58.296	cmhd9znsp0000r1v4xcv3034p
cmhdb44gu004jr1t4zn3bq4oa	Eren	Çelik	+90 5555449110	2017-10-30 10:53:58.302	cmhdb10s00003r14k063dfdts	t	2025-10-30 10:53:58.303	2025-10-30 10:53:58.303	2025-10-30 10:53:58.303	cmhd9znsp0000r1v4xcv3034p
cmhdb44h0004mr1t4xojkbgph	Eren	Yıldırım	+90 5692900635	2017-10-30 10:53:58.308	cmhdb10s00003r14k063dfdts	t	2025-10-30 10:53:58.309	2025-10-30 10:53:58.309	2025-10-30 10:53:58.309	cmhd9znsp0000r1v4xcv3034p
cmhdb44h7004pr1t4ypsfsagn	Ahmet	Doğan	+90 5638893209	2015-10-30 10:53:58.315	cmhdb10s00003r14k063dfdts	t	2025-10-30 10:53:58.316	2025-10-30 10:53:58.316	2025-10-30 10:53:58.316	cmhd9znsp0000r1v4xcv3034p
cmhdb44hd004sr1t4ptma7ckw	Mehmet	Öztürk	+90 5579776282	2016-10-30 10:53:58.321	cmhdb10s00003r14k063dfdts	t	2025-10-30 10:53:58.321	2025-10-30 10:53:58.321	2025-10-30 10:53:58.321	cmhd9znsp0000r1v4xcv3034p
cmhdb44hr004yr1t4rumvjhox	Kerem	Kaya	+90 5484673506	2015-10-30 10:53:58.334	cmhdb10s00003r14k063dfdts	t	2025-10-30 10:53:58.335	2025-10-30 10:53:58.335	2025-10-30 10:53:58.335	cmhd9znsp0000r1v4xcv3034p
cmhdb44hw0051r1t46ubnnjgu	Deniz	Doğan	+90 5567107608	2013-10-30 11:53:58.34	cmhdb10s00003r14k063dfdts	t	2025-10-30 10:53:58.341	2025-10-30 10:53:58.341	2025-10-30 10:53:58.341	cmhd9znsp0000r1v4xcv3034p
cmhdb44i40054r1t44ph99dyy	Kerem	Aydın	+90 5727736888	2014-10-30 11:53:58.347	cmhdb10s00003r14k063dfdts	t	2025-10-30 10:53:58.348	2025-10-30 10:53:58.348	2025-10-30 10:53:58.348	cmhd9znsp0000r1v4xcv3034p
cmhdb44ic0057r1t4dhmlwpd8	Eren	Özdemir	+90 5765915291	2013-10-30 11:53:58.356	\N	t	2025-10-30 10:53:58.357	2025-10-30 10:53:58.357	2025-10-30 11:47:25.527	cmhd9znsp0000r1v4xcv3034p
cmhdb44ro009ar1t4yomqamm5	Ahmet	Şahin	+90 5706893303	2016-10-30 10:53:58.691	\N	t	2025-10-30 10:53:58.692	2025-10-30 10:53:58.692	2025-10-30 11:47:28.579	cmhd9znsp0000r1v4xcv3034p
cmhdb44me006vr1t4nkfgj3uv	Emre	Öztürk	+90 5802247596	2017-10-30 10:53:58.502	\N	t	2025-10-30 10:53:58.503	2025-10-30 10:53:58.503	2025-10-30 11:47:31.62	cmhd9znsp0000r1v4xcv3034p
cmhdb44mk006yr1t4odp8lujb	Mehmet	Öztürk	+90 5130244281	2013-10-30 11:53:58.508	\N	t	2025-10-30 10:53:58.508	2025-10-30 10:53:58.508	2025-10-30 11:47:31.62	cmhd9znsp0000r1v4xcv3034p
cmhdb44mr0071r1t4xgndq830	Kerem	Demir	+90 5889263944	2013-10-30 11:53:58.514	\N	t	2025-10-30 10:53:58.515	2025-10-30 10:53:58.515	2025-10-30 11:47:31.62	cmhd9znsp0000r1v4xcv3034p
cmhdb44mz0074r1t44ttsmijz	Berk	Demir	+90 5690686930	2013-10-30 11:53:58.522	\N	t	2025-10-30 10:53:58.523	2025-10-30 10:53:58.523	2025-10-30 11:47:31.62	cmhd9znsp0000r1v4xcv3034p
cmhdb44n50077r1t4w2exedss	Mert	Yıldız	+90 5320676773	2014-10-30 11:53:58.529	\N	t	2025-10-30 10:53:58.53	2025-10-30 10:53:58.53	2025-10-30 11:47:31.62	cmhd9znsp0000r1v4xcv3034p
cmhdb44nc007ar1t4g0gn9ggj	Berk	Yıldırım	+90 5371764344	2014-10-30 11:53:58.536	\N	t	2025-10-30 10:53:58.537	2025-10-30 10:53:58.537	2025-10-30 11:47:31.62	cmhd9znsp0000r1v4xcv3034p
cmhdb44ni007dr1t47ee4kfo9	Eren	Aydın	+90 5154246092	2014-10-30 11:53:58.541	\N	t	2025-10-30 10:53:58.542	2025-10-30 10:53:58.542	2025-10-30 11:47:31.62	cmhd9znsp0000r1v4xcv3034p
cmhdb44np007gr1t42i6x5q2h	Deniz	Polat	+90 5132760243	2015-10-30 10:53:58.548	\N	t	2025-10-30 10:53:58.549	2025-10-30 10:53:58.549	2025-10-30 11:47:31.62	cmhd9znsp0000r1v4xcv3034p
cmhdb44km0061r1t4q0zrzyms	Kerem	Polat	+90 5531717913	2014-10-30 11:53:58.437	\N	t	2025-10-30 10:53:58.438	2025-10-30 10:53:58.438	2025-10-30 11:47:35.263	cmhd9znsp0000r1v4xcv3034p
cmhdb44ks0064r1t4mlg7iiby	Mert	Aydın	+90 5837676029	2014-10-30 11:53:58.443	\N	t	2025-10-30 10:53:58.445	2025-10-30 10:53:58.445	2025-10-30 11:47:35.263	cmhd9znsp0000r1v4xcv3034p
cmhdb44kz0067r1t417omj02f	Furkan	Kaya	+90 5530883741	2017-10-30 10:53:58.45	\N	t	2025-10-30 10:53:58.451	2025-10-30 10:53:58.451	2025-10-30 11:47:35.263	cmhd9znsp0000r1v4xcv3034p
cmhdb44l4006ar1t4sxznl6ce	Cem	Şahin	+90 5761846071	2016-10-30 10:53:58.456	\N	t	2025-10-30 10:53:58.457	2025-10-30 10:53:58.457	2025-10-30 11:47:35.263	cmhd9znsp0000r1v4xcv3034p
cmhdb44lc006dr1t4rk8avu78	Emre	Yılmaz	+90 5610446523	2013-10-30 11:53:58.464	\N	t	2025-10-30 10:53:58.465	2025-10-30 10:53:58.465	2025-10-30 11:47:35.263	cmhd9znsp0000r1v4xcv3034p
cmhdb44li006gr1t4p95uc4kl	Emre	Karaağaç	+90 5341664384	2016-10-30 10:53:58.47	\N	t	2025-10-30 10:53:58.471	2025-10-30 10:53:58.471	2025-10-30 11:47:35.263	cmhd9znsp0000r1v4xcv3034p
cmhdb44lp006jr1t4nfjyuuyl	Berk	Karaağaç	+90 5299065145	2013-10-30 11:53:58.476	\N	t	2025-10-30 10:53:58.477	2025-10-30 10:53:58.477	2025-10-30 11:47:35.263	cmhd9znsp0000r1v4xcv3034p
cmhdb44lv006mr1t445aypf4y	Emre	Öztürk	+90 5994917913	2013-10-30 11:53:58.483	\N	t	2025-10-30 10:53:58.484	2025-10-30 10:53:58.484	2025-10-30 11:47:35.263	cmhd9znsp0000r1v4xcv3034p
cmhdb44m1006pr1t4wegzobhf	Can	Aydın	+90 5288560830	2017-10-30 10:53:58.489	\N	t	2025-10-30 10:53:58.49	2025-10-30 10:53:58.49	2025-10-30 11:47:35.263	cmhd9znsp0000r1v4xcv3034p
cmhdb44m8006sr1t42vqcgtto	Ali	Polat	+90 5611858957	2014-10-30 11:53:58.495	\N	t	2025-10-30 10:53:58.496	2025-10-30 10:53:58.496	2025-10-30 11:47:35.263	cmhd9znsp0000r1v4xcv3034p
cmhdb44hj004vr1t4poa3trgn	Ahmet	Aydın	+90 5859421605	2017-10-30 10:53:58.326	cmhdb10s00003r14k063dfdts	t	2025-10-30 10:53:58.327	2025-10-30 10:53:58.327	2025-10-31 11:15:51.296	cmhd9znsp0000r1v4xcv3034p
cmhdb44ad001jr1t4wppt5s84	Ahmet	Aydın	+90 5213903608	2016-10-30 10:53:58.068	cmhd9znt70002r1v46mrowpnl	t	2025-10-30 10:53:58.069	2025-10-30 10:53:58.069	2025-10-31 11:15:51.924	cmhd9znsp0000r1v4xcv3034p
cmhdb44ot007yr1t4ruargwst	Ahmet	Öztürk	+90 5987445734	2015-10-30 10:53:58.589	cmhdb446m0003r1t40xt7u0y1	t	2025-10-30 10:53:58.589	2025-10-30 10:53:58.589	2025-10-30 10:53:58.589	cmhd9znsp0000r1v4xcv3034p
cmhdb44nw007jr1t4lha5cyhn	Cem	Polat	+90 5561231201	2014-10-30 11:53:58.555	\N	t	2025-10-30 10:53:58.556	2025-10-30 10:53:58.556	2025-10-30 11:47:31.62	cmhd9znsp0000r1v4xcv3034p
cmhdb44o3007mr1t4g7802zju	Eren	Kaya	+90 5235188758	2013-10-30 11:53:58.562	\N	t	2025-10-30 10:53:58.563	2025-10-30 10:53:58.563	2025-10-30 11:47:31.62	cmhd9znsp0000r1v4xcv3034p
cmhdb44in005ar1t46xheeiw3	Eren	Öztürk	+90 5496319942	2016-10-30 10:53:58.366	\N	t	2025-10-30 10:53:58.367	2025-10-30 10:53:58.367	2025-10-30 11:47:25.527	cmhd9znsp0000r1v4xcv3034p
cmhdb44ix005dr1t4l1lkla3p	Kerem	Özdemir	+90 5336878656	2014-10-30 11:53:58.375	\N	t	2025-10-30 10:53:58.377	2025-10-30 10:53:58.377	2025-10-30 11:47:25.527	cmhd9znsp0000r1v4xcv3034p
cmhdb44jg005jr1t4xhj8jp2q	Cem	Yıldırım	+90 5147288850	2016-10-30 10:53:58.396	\N	t	2025-10-30 10:53:58.397	2025-10-30 10:53:58.397	2025-10-30 11:47:25.527	cmhd9znsp0000r1v4xcv3034p
cmhdb44jo005mr1t48j0tu2kh	Eren	Demir	+90 5857901275	2015-10-30 10:53:58.403	\N	t	2025-10-30 10:53:58.404	2025-10-30 10:53:58.404	2025-10-30 11:47:25.527	cmhd9znsp0000r1v4xcv3034p
cmhdb44ju005pr1t4lvbhepmh	Ali	Çelik	+90 5238509497	2014-10-30 11:53:58.409	\N	t	2025-10-30 10:53:58.41	2025-10-30 10:53:58.41	2025-10-30 11:47:25.527	cmhd9znsp0000r1v4xcv3034p
cmhdb44k2005sr1t4ua1p1g84	Furkan	Şahin	+90 5416462775	2016-10-30 10:53:58.417	\N	t	2025-10-30 10:53:58.418	2025-10-30 10:53:58.418	2025-10-30 11:47:25.527	cmhd9znsp0000r1v4xcv3034p
cmhdb44k8005vr1t4vz83shgq	Kaan	Şahin	+90 5244806940	2016-10-30 10:53:58.423	\N	t	2025-10-30 10:53:58.424	2025-10-30 10:53:58.424	2025-10-30 11:47:25.527	cmhd9znsp0000r1v4xcv3034p
cmhdb44kg005yr1t4y4xdpi3d	Ali	Yıldırım	+90 5495150977	2015-10-30 10:53:58.431	\N	t	2025-10-30 10:53:58.432	2025-10-30 10:53:58.432	2025-10-30 11:47:25.527	cmhd9znsp0000r1v4xcv3034p
cmhdb44q3008jr1t4luc0z5vz	Ahmet	Çelik	+90 5919295351	2016-10-30 10:53:58.634	\N	t	2025-10-30 10:53:58.635	2025-10-30 10:53:58.635	2025-10-30 11:47:28.579	cmhd9znsp0000r1v4xcv3034p
cmhdb44q9008mr1t499jppsd9	Mert	Yıldız	+90 5400622181	2017-10-30 10:53:58.64	\N	t	2025-10-30 10:53:58.641	2025-10-30 10:53:58.641	2025-10-30 11:47:28.579	cmhd9znsp0000r1v4xcv3034p
cmhdb44qm008sr1t4xqpwapxj	Burak	Şahin	+90 5303503514	2016-10-30 10:53:58.654	\N	t	2025-10-30 10:53:58.655	2025-10-30 10:53:58.655	2025-10-30 11:47:28.579	cmhd9znsp0000r1v4xcv3034p
cmhdb44qs008vr1t43pup845y	Mustafa	Öztürk	+90 5526791121	2015-10-30 10:53:58.66	\N	t	2025-10-30 10:53:58.661	2025-10-30 10:53:58.661	2025-10-30 11:47:28.579	cmhd9znsp0000r1v4xcv3034p
cmhdb44qz008yr1t48zmzoy2o	Eren	Yılmaz	+90 5279625242	2014-10-30 11:53:58.666	\N	t	2025-10-30 10:53:58.667	2025-10-30 10:53:58.667	2025-10-30 11:47:28.579	cmhd9znsp0000r1v4xcv3034p
cmhdb44r50091r1t4roeje66b	Furkan	Aydın	+90 5267021019	2016-10-30 10:53:58.672	\N	t	2025-10-30 10:53:58.673	2025-10-30 10:53:58.673	2025-10-30 11:47:28.579	cmhd9znsp0000r1v4xcv3034p
cmhdb44rb0094r1t4b3ex5lk0	Berk	Çelik	+90 5239147755	2013-10-30 11:53:58.679	\N	t	2025-10-30 10:53:58.68	2025-10-30 10:53:58.68	2025-10-30 11:47:28.579	cmhd9znsp0000r1v4xcv3034p
cmhdb44on007vr1t4munhk9ws	Eren	Arslan	+90 5961724262	2015-10-30 00:00:00	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:58.584	2025-10-30 10:53:58.584	2025-10-30 12:17:56.189	cmhd9znsp0000r1v4xcv3034p
cmhdb44og007sr1t4n9u6r2b8	Mehmet	Karaağaç	+90 5204464557	2015-10-30 00:00:00	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:58.576	2025-10-30 10:53:58.576	2025-10-30 12:39:21.743	cmhd9znsp0000r1v4xcv3034p
cmhdb44pk008ar1t40urxukj3	Can	Arslan	+90 5142793142	2014-10-30 11:53:58.615	cmhdb446m0003r1t40xt7u0y1	t	2025-10-30 10:53:58.616	2025-10-30 10:53:58.616	2025-10-30 12:56:34.87	cmhd9znsp0000r1v4xcv3034p
cmhdb44pd0087r1t4ixvk0iy5	Emre	Aslan	+90 5323399968	2014-10-30 11:53:58.608	cmhdb446m0003r1t40xt7u0y1	t	2025-10-30 10:53:58.609	2025-10-30 10:53:58.609	2025-10-30 12:56:39.976	cmhd9znsp0000r1v4xcv3034p
cmhdb44pv008gr1t4a5ho33e6	Mustafa	Aslan	+90 5483154483	2013-10-30 11:53:58.627	cmhdb446m0003r1t40xt7u0y1	t	2025-10-30 10:53:58.628	2025-10-30 10:53:58.628	2025-10-30 12:56:41.071	cmhd9znsp0000r1v4xcv3034p
cmhdb44oa007pr1t4dol1i6sb	Kaan	Demir	+90 5665388147	2016-10-30 10:53:58.57	cmhdb446m0003r1t40xt7u0y1	t	2025-10-30 10:53:58.571	2025-10-30 10:53:58.571	2025-10-30 12:56:41.795	cmhd9znsp0000r1v4xcv3034p
cmhdb44p00081r1t4pcbiwdzi	Mehmet	Yıldırım	+90 5727667661	2015-10-30 00:00:00	cmhdb446m0003r1t40xt7u0y1	t	2025-10-30 10:53:58.596	2025-10-30 10:53:58.596	2025-10-30 12:56:43.104	cmhd9znsp0000r1v4xcv3034p
cmhdb44p70084r1t4vre2k1sq	Cem	Yıldız	+90 5965531945	2015-10-30 10:53:58.602	cmhdb446m0003r1t40xt7u0y1	t	2025-10-30 10:53:58.603	2025-10-30 10:53:58.603	2025-10-30 12:56:44.19	cmhd9znsp0000r1v4xcv3034p
cmhdb44pq008dr1t4cndvhnfs	Emre	Çelik	+90 5571613291	2013-10-30 11:53:58.621	cmhdb446m0003r1t40xt7u0y1	t	2025-10-30 10:53:58.622	2025-10-30 10:53:58.622	2025-10-30 12:56:45.18	cmhd9znsp0000r1v4xcv3034p
cmhdb44j8005gr1t4144a41vc	Cem	Arslan	+90 5423279571	2014-10-30 00:00:00	cmhd9znt00001r1v4797lj4ps	t	2025-10-30 10:53:58.389	2025-10-30 10:53:58.389	2025-10-30 13:05:59.188	cmhd9znsp0000r1v4xcv3034p
cmhdb44qg008pr1t4fa3acvp1	Ahmet	Arslan	+90 5423136055	2014-10-30 00:00:00	cmhd9znt70002r1v46mrowpnl	t	2025-10-30 10:53:58.649	2025-10-30 10:53:58.649	2025-10-31 11:15:50.525	cmhd9znsp0000r1v4xcv3034p
\.


--
-- Data for Name: trainers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trainers (id, name, "position", experience, license, photo, biography, "isActive", "createdAt", "updatedAt") FROM stdin;
cmhda4xp40000r1n48xeixqbl	Ahmet Yılmaz	Baş Antrenör	15	UEFA PRO	\N	\N	t	2025-10-30 10:26:36.568	2025-10-30 10:26:36.568
cmhda4xpa0001r1n4wj5v8nv7	Mehmet Demir	Antrenör	10	UEFA A	\N	\N	t	2025-10-30 10:26:36.574	2025-10-30 10:26:36.574
cmhda4xpf0002r1n4s6nhkt6s	Ali Kaya	Yardımcı Antrenör	5	UEFA B	\N	\N	t	2025-10-30 10:26:36.579	2025-10-30 10:26:36.579
cmhda4xpj0003r1n4vrg7ac54	Fatma Özkan	Kaleci Antrenörü	8	UEFA A	\N	\N	t	2025-10-30 10:26:36.583	2025-10-30 10:26:36.583
cmhekduqz000tr1esuc3zwbe9	Oğuz Ünal	Antrenör	4	UEFA B	data:image/jpeg;base64,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	sASasAS	t	2025-10-31 08:01:14.971	2025-10-31 08:01:14.971
\.


--
-- Data for Name: training_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.training_sessions (id, "trainingId", date, "startTime", "endTime", location, notes, "isCancelled", "createdAt", "updatedAt") FROM stdin;
cmhk8g8cl001lqj01jeht9va5	cmhk8g8cl001kqj01jbn1ouuu	2025-11-04 00:00:00	2025-11-04 10:00:00	2025-11-04 11:00:00	Karaman		f	2025-11-04 07:13:47.589	2025-11-04 07:13:47.589
\.


--
-- Data for Name: trainings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.trainings (id, "groupId", name, description, "isActive", "createdAt", "updatedAt") FROM stdin;
cmhk8g8cl001kqj01jbn1ouuu	cmhd9znt00001r1v4797lj4ps	FO-A1		t	2025-11-04 07:13:47.589	2025-11-04 07:13:47.589
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, password, name, phone, role, "isActive", "createdAt", "updatedAt", "trainerId") FROM stdin;
cmhd9znsp0000r1v4xcv3034p	admin@futbolokulu.com	$2b$12$vrmjGOhhMwOZpYgmkArZQ.8I53aDGI3TyOCCpTpmXHNmLYLU9GZQe	Admin User	+90 555 123 4567	ADMIN	t	2025-10-30 10:22:30.457	2025-10-30 10:22:30.457	\N
cmhkanau40000s301d17vr02g	core@spormanage.com.tr	$2b$10$1qIlO/pBDY1zAkHUotplu.RY6c1S6L/cT9RCgrxJGcLrVSulwjQta	Core	05305758377	ADMIN	t	2025-11-04 08:15:16.636	2025-11-04 08:15:16.636	\N
\.


--
-- Name: _StudentParents _StudentParents_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_StudentParents"
    ADD CONSTRAINT "_StudentParents_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: attendances attendances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT attendances_pkey PRIMARY KEY (id);


--
-- Name: fee_types fee_types_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_types
    ADD CONSTRAINT fee_types_pkey PRIMARY KEY (id);


--
-- Name: group_histories group_histories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_histories
    ADD CONSTRAINT group_histories_pkey PRIMARY KEY (id);


--
-- Name: groups groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: parents parents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT parents_pkey PRIMARY KEY (id);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);


--
-- Name: students students_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT students_pkey PRIMARY KEY (id);


--
-- Name: trainers trainers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trainers
    ADD CONSTRAINT trainers_pkey PRIMARY KEY (id);


--
-- Name: training_sessions training_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT training_sessions_pkey PRIMARY KEY (id);


--
-- Name: trainings trainings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT trainings_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: _StudentParents_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_StudentParents_B_index" ON public."_StudentParents" USING btree ("B");


--
-- Name: attendances_studentId_sessionId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "attendances_studentId_sessionId_key" ON public.attendances USING btree ("studentId", "sessionId");


--
-- Name: groups_name_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX groups_name_key ON public.groups USING btree (name);


--
-- Name: notifications_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_createdAt_idx" ON public.notifications USING btree ("createdAt");


--
-- Name: notifications_method_status_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_method_status_createdAt_idx" ON public.notifications USING btree (method, status, "createdAt");


--
-- Name: notifications_studentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "notifications_studentId_idx" ON public.notifications USING btree ("studentId");


--
-- Name: payments_dueDate_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payments_dueDate_status_idx" ON public.payments USING btree ("dueDate", status);


--
-- Name: payments_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX payments_status_idx ON public.payments USING btree (status);


--
-- Name: payments_studentId_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "payments_studentId_status_idx" ON public.payments USING btree ("studentId", status);


--
-- Name: students_groupId_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "students_groupId_isActive_idx" ON public.students USING btree ("groupId", "isActive");


--
-- Name: students_isActive_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "students_isActive_idx" ON public.students USING btree ("isActive");


--
-- Name: students_lastName_firstName_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "students_lastName_firstName_idx" ON public.students USING btree ("lastName", "firstName");


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: _StudentParents _StudentParents_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_StudentParents"
    ADD CONSTRAINT "_StudentParents_A_fkey" FOREIGN KEY ("A") REFERENCES public.parents(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _StudentParents _StudentParents_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_StudentParents"
    ADD CONSTRAINT "_StudentParents_B_fkey" FOREIGN KEY ("B") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attendances attendances_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "attendances_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendances attendances_sessionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "attendances_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES public.training_sessions(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attendances attendances_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendances
    ADD CONSTRAINT "attendances_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fee_types fee_types_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fee_types
    ADD CONSTRAINT "fee_types_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: group_histories group_histories_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_histories
    ADD CONSTRAINT "group_histories_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: group_histories group_histories_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.group_histories
    ADD CONSTRAINT "group_histories_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: groups groups_assistantCoachId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "groups_assistantCoachId_fkey" FOREIGN KEY ("assistantCoachId") REFERENCES public.trainers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: groups groups_coachId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.groups
    ADD CONSTRAINT "groups_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES public.trainers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notes notes_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notes notes_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "notes_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT "notifications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: payments payments_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_feeTypeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_feeTypeId_fkey" FOREIGN KEY ("feeTypeId") REFERENCES public.fee_types(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: payments payments_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT "payments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public.students(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: students students_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "students_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: students students_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.students
    ADD CONSTRAINT "students_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: training_sessions training_sessions_trainingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.training_sessions
    ADD CONSTRAINT "training_sessions_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES public.trainings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: trainings trainings_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.trainings
    ADD CONSTRAINT "trainings_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public.groups(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: users users_trainerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_trainerId_fkey" FOREIGN KEY ("trainerId") REFERENCES public.trainers(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

