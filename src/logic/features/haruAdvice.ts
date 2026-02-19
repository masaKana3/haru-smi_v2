import { WeatherData } from "../../api/weather";
import { DailyAnswers } from "../../types/daily";

type NormalizedWeather = {
  feelsCold: boolean;
  lowPressure: boolean;
  condition: string;
};

type NormalizedSymptoms = {
  isFatigued: boolean;
  moodDown: boolean;
  hasCold: boolean;
  bleeding: boolean;
  headache: boolean;
};

function normalizeWeather(weather: WeatherData): NormalizedWeather {
  const temp = Number.isFinite(weather.apparent_temperature)
    ? weather.apparent_temperature
    : weather.temperature_2m;

  const pressure = weather.surface_pressure;

  return {
    feelsCold: temp <= 12,
    lowPressure: weather.pressureLevel === "low" || pressure < 1007,
    condition: weather.condition ?? "",
  };
}

function normalizeSymptoms(symptoms: DailyAnswers): NormalizedSymptoms {
  const fatigue = symptoms.fatigue;
  const mood = symptoms.mood;
  const cold = symptoms.cold;
  const bleeding = symptoms.bleeding;
  const headache = symptoms.headache;

  return {
    isFatigued: fatigue === "かなり疲れている" || fatigue === "少し疲れている",
    moodDown: mood === "とても落ち込んだ" || mood === "少し落ち込んだ",
    hasCold: cold === "強い" || cold === "中くらい",
    bleeding: bleeding === "多い" || bleeding === "少量",
    headache: headache === "強い" || headache === "中くらい",
  };
}

export function generateHaruAdvice(
  weatherData: WeatherData,
  symptoms: DailyAnswers
): string {
  if (!weatherData || !symptoms) {
    return "今日はゆっくり深呼吸を。体の声を聞きながら、温かい飲み物でほっと一息ついてくださいね。";
  }

  const weather = normalizeWeather(weatherData);
  const flags = normalizeSymptoms(symptoms);

  const summaryPieces: string[] = [];

  if (weather.lowPressure && weather.feelsCold) {
    summaryPieces.push("気圧も気温も低めで体がこわばりやすい日です。ぬくもりを大切に過ごしましょうね😊");
  } else if (weather.lowPressure) {
    summaryPieces.push("気圧が低めで頭が重くなりやすいかも。ゆったり深呼吸を。");
  } else if (weather.feelsCold) {
    summaryPieces.push("冷えやすい空気で筋肉が固まりやすい日。温かさを足してあげましょう。");
  } else {
    summaryPieces.push("穏やかなお天気で、体も心もゆったり過ごせそうな日。");
  }

  if (flags.moodDown) {
    summaryPieces.push("気持ちも揺れやすいかもしれません。無理に頑張らなくて大丈夫。");
  } else if (flags.isFatigued) {
    summaryPieces.push("少し疲れがたまり気味かも。こまめに休んでくださいね。");
  }

  const body: string[] = [];

  if (weather.feelsCold || flags.hasCold) {
    body.push("首・肩・腰をやさしく温めて、こわばりをほどいてあげましょう。カイロやブランケットもおすすめです。");
  }

  if (weather.lowPressure || flags.headache) {
    body.push("低気圧や頭痛を感じたら、こめかみをゆっくりほぐしながら深呼吸を。明かりを少し落として休めると◎");
  }

  if (flags.isFatigued) {
    body.push("家事や仕事も小さく区切って、こまめに座る・横になる時間をはさんでくださいね。");
  }

  if (flags.moodDown) {
    body.push("気持ちが沈むときは、好きな香りや音楽で気分転換を。あなたのペースで大丈夫です。");
  }

  if (flags.bleeding) {
    body.push("出血がある日は温かい飲み物を少し多めに。痛みや量が気になるときは早めに相談を。");
  }

  if (body.length === 0) {
    body.push("今日はゆったり、自分のペースで過ごせば十分です。こまめな水分と深い呼吸を心がけてくださいね。");
  }

  const summary = summaryPieces.join(" ");

  return `${summary}\n${body.join(" ")}`;
}