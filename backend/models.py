import datetime
from sqlalchemy import create_engine, Column, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker
from config import DB_URI

Base = declarative_base()
engine = create_engine(DB_URI, echo=False)
Session = sessionmaker(bind=engine)


class Metric(Base):
    """FRED 宏观指标数据 - 使用 SQLite 存储"""
    __tablename__ = 'metrics'
    id = Column(String, primary_key=True)
    name = Column(String)
    ticker = Column(String)
    value = Column(Float)
    secondary_value = Column(Float, nullable=True)
    unit = Column(String)
    description = Column(String)
    status_text = Column(String)
    status_color = Column(String)
    history_json = Column(Text)
    last_updated = Column(DateTime, default=datetime.datetime.utcnow)


def init_db():
    """初始化数据库（仅 metrics 表）"""
    Base.metadata.create_all(engine)

